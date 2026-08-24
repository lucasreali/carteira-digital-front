import type { MockPixCharge, MockPixKey } from "../db";
import { commit, db, newId, nowIso } from "../db";
import { credit, debit } from "../ledger";
import { route } from "../router";
import {
	CHARGE_PAYMENT_DELAY_MS,
	findWallet,
	idempotencyReplay,
	insufficientFunds,
	notFound,
	pushTransaction,
	rememberIdempotency,
	requireUser,
	toTransaction,
	unauthorized,
} from "../shared";
import { fail, json, noContent } from "../support";

const MAX_KEYS_PER_USER = 5;

function withoutOwner<TRecord extends { user_id: string }>(record: TRecord) {
	const { user_id: _ownerId, ...rest } = record;
	return rest;
}

function qrCodeFor(amount: number, holder: string) {
	const value = (amount / 100).toFixed(2);
	return `00020126580014BR.GOV.BCB.PIX0136${newId()}520400005303986540${value.length}${value}5802BR59${holder.length.toString().padStart(2, "0")}${holder}6008CURITIBA62070503***6304${newId().slice(0, 4).toUpperCase()}`;
}

route("GET", "/pix/keys", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const keys = db()
		.pixKeys.filter((key) => key.user_id === user.id)
		.map(withoutOwner);
	return json({ data: keys });
});

route("POST", "/pix/keys", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const payload = await context.body();
	const state = db();
	const owned = state.pixKeys.filter((key) => key.user_id === user.id);
	if (owned.length >= MAX_KEYS_PER_USER) {
		return fail(
			422,
			"pix_key_limit_reached",
			"Limite de 5 chaves por pessoa física atingido.",
		);
	}

	const type = payload.type as MockPixKey["type"];
	const value = type === "random" ? newId() : String(payload.value ?? "");
	if (state.pixKeys.some((key) => key.value === value)) {
		return fail(
			409,
			"pix_key_taken",
			"Esta chave já está registrada em outra instituição. Solicite a portabilidade.",
		);
	}

	const wallet = findWallet(user, String(payload.wallet_id ?? ""));
	if (!wallet) return notFound();

	const key: MockPixKey = {
		id: `pk_${newId()}`,
		user_id: user.id,
		type,
		value,
		wallet_id: wallet.id,
		status: "active",
		created_at: nowIso(),
	};
	state.pixKeys.push(key);
	commit();

	return json(withoutOwner(key), 201);
});

route("DELETE", "/pix/keys/:pixKeyId", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const state = db();
	const index = state.pixKeys.findIndex(
		(key) => key.id === context.params.pixKeyId && key.user_id === user.id,
	);
	if (index < 0) return notFound();

	state.pixKeys.splice(index, 1);
	commit();
	return noContent();
});

route("POST", "/pix/charges", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const payload = await context.body();
	const { key, replay } = idempotencyReplay(context.request, payload);
	if (replay) return replay;

	const wallet = findWallet(user, String(payload.wallet_id ?? ""));
	if (!wallet) return notFound();

	const amount = Number(payload.amount ?? 0);
	const expiresIn = Number(payload.expires_in ?? 3600);
	const charge: MockPixCharge = {
		id: `chg_${newId()}`,
		user_id: user.id,
		wallet_id: wallet.id,
		amount,
		status: "active",
		qr_code: qrCodeFor(amount, user.full_name.toUpperCase().slice(0, 25)),
		qr_code_image_url: "",
		description: (payload.description as string) ?? null,
		expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
		paid_at: null,
		transaction_id: null,
		created_at: nowIso(),
	};
	db().pixCharges.unshift(charge);
	commit();

	if (amount > 0) {
		setTimeout(() => {
			if (charge.status !== "active") return;
			const transaction = pushTransaction({
				id: newId(),
				user_id: user.id,
				type: "pix_in",
				status: "completed",
				amount,
				fee: 0,
				net_amount: amount,
				currency: wallet.currency,
				source_wallet_id: null,
				destination_wallet_id: wallet.id,
				description: charge.description ?? "Cobrança Pix",
				metadata: { charge_id: charge.id, counterparty_name: "Pagador Pix" },
				idempotency_key: null,
				created_at: nowIso(),
				completed_at: nowIso(),
			});
			charge.status = "paid";
			charge.paid_at = nowIso();
			charge.transaction_id = transaction.id;
			credit({
				wallet,
				amount,
				transactionId: transaction.id,
				type: "pix_in",
				description: `Pix recebido — ${charge.description ?? charge.id}`,
			});
		}, CHARGE_PAYMENT_DELAY_MS);
	}

	const response = withoutOwner(charge);
	rememberIdempotency(key, payload, response, 201);
	return json(response, 201);
});

route("GET", "/pix/charges/:chargeId", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const charge = db().pixCharges.find(
		(candidate) =>
			candidate.id === context.params.chargeId && candidate.user_id === user.id,
	);
	return charge ? json(withoutOwner(charge)) : notFound();
});

route("DELETE", "/pix/charges/:chargeId", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const charge = db().pixCharges.find(
		(candidate) =>
			candidate.id === context.params.chargeId && candidate.user_id === user.id,
	);
	if (!charge) return notFound();
	if (charge.status !== "active") {
		return fail(
			409,
			"charge_not_cancelable",
			"Cobrança já foi paga ou expirou.",
			[{ field: "status", issue: charge.status }],
		);
	}

	charge.status = "canceled";
	commit();
	return noContent();
});

route("POST", "/pix/payments", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const payload = await context.body();
	const { key, replay } = idempotencyReplay(context.request, payload);
	if (replay) return replay;

	if (payload.pix_key && payload.qr_code) {
		return fail(
			400,
			"bad_request",
			"Informe a chave Pix ou o código copia-e-cola, não ambos.",
		);
	}

	const source = findWallet(user, String(payload.source_wallet_id ?? ""));
	if (!source) return notFound();

	const state = db();
	const pixKey = payload.pix_key
		? state.pixKeys.find((candidate) => candidate.value === payload.pix_key)
		: state.pixKeys.find((candidate) => candidate.user_id !== user.id);

	if (!pixKey)
		return fail(404, "pix_key_not_found", "Chave Pix não encontrada no DICT.");

	const destination = state.wallets.find(
		(wallet) => wallet.id === pixKey.wallet_id,
	);
	if (!destination)
		return fail(404, "pix_key_not_found", "Chave Pix não encontrada no DICT.");
	if (destination.id === source.id) {
		return fail(
			400,
			"bad_request",
			"A chave Pix informada pertence à carteira de origem.",
		);
	}

	const amount = Number(payload.amount ?? 0);
	if (amount <= 0) {
		return fail(
			422,
			"amount_out_of_range",
			"Informe um valor válido para o pagamento.",
			[{ field: "amount", issue: "mínimo: 1" }],
		);
	}
	if (amount > source.available_balance)
		return insufficientFunds(amount, source.available_balance);

	const counterparty = state.users.find(
		(candidate) => candidate.id === destination.user_id,
	);
	const endToEndId = `E${newId().replace(/-/g, "").slice(0, 30)}`;

	const outgoing = pushTransaction({
		id: newId(),
		user_id: user.id,
		type: "pix_out",
		status: "completed",
		amount,
		fee: 0,
		net_amount: amount,
		currency: source.currency,
		source_wallet_id: source.id,
		destination_wallet_id: destination.id,
		description: (payload.description as string) ?? "Pagamento Pix",
		metadata: {
			end_to_end_id: endToEndId,
			counterparty_name: counterparty?.full_name ?? "Destinatário Pix",
			pix_key: pixKey.value,
		},
		idempotency_key: key,
		created_at: nowIso(),
		completed_at: nowIso(),
	});

	debit({
		wallet: source,
		amount,
		transactionId: outgoing.id,
		type: "pix_out",
		description: `Pix enviado para ${counterparty?.full_name ?? pixKey.value}`,
	});
	credit({
		wallet: destination,
		amount,
		transactionId: outgoing.id,
		type: "pix_in",
		description: `Pix recebido de ${user.full_name}`,
	});
	commit();

	const response = toTransaction(outgoing);
	rememberIdempotency(key, payload, response, 201);
	return json(response, 201);
});
