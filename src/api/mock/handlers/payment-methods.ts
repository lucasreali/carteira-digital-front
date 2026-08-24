import type { MockPaymentMethod } from "../db";
import { commit, db, newId, nowIso } from "../db";
import { route } from "../router";
import { notFound, requireUser, unauthorized } from "../shared";
import { fail, json, maskDocument, noContent, paginate } from "../support";

const BANK_NAMES: Record<string, string> = {
	"001": "Banco do Brasil",
	"033": "Santander",
	"104": "Caixa Econômica Federal",
	"237": "Bradesco",
	"260": "Nubank",
	"341": "Itaú Unibanco",
	"077": "Banco Inter",
	"336": "C6 Bank",
};

const CARD_BRANDS = ["visa", "mastercard", "elo"] as const;

function withoutOwner(method: MockPaymentMethod) {
	const { user_id: _ownerId, ...rest } = method;
	return rest;
}

route("GET", "/payment-methods", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const type = context.query.get("type");
	const methods = db()
		.paymentMethods.filter((method) => method.user_id === user.id)
		.filter((method) => (type ? method.type === type : true))
		.map(withoutOwner);

	return json(paginate(methods, context.query.get("limit"), context.query.get("cursor")));
});

route("POST", "/payment-methods", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const payload = await context.body();
	const state = db();
	const isDefault = Boolean(payload.is_default);

	if (payload.type === "bank_account") {
		const account = payload.bank_account as Record<string, string>;
		const accountMasked = `****${account.account_number.slice(-1)}-${account.account_digit}`;
		const duplicated = state.paymentMethods.some(
			(method) =>
				method.user_id === user.id &&
				method.bank_account?.bank_code === account.bank_code &&
				method.bank_account?.agency === account.agency &&
				method.bank_account?.account_masked === accountMasked,
		);
		if (duplicated) {
			return fail(
				409,
				"payment_method_exists",
				"Esta conta bancária já está vinculada ao seu perfil.",
			);
		}

		const method: MockPaymentMethod = {
			id: `pm_${newId()}`,
			user_id: user.id,
			type: "bank_account",
			is_default: isDefault,
			status: "pending_verification",
			bank_account: {
				bank_code: account.bank_code,
				bank_name: BANK_NAMES[account.bank_code] ?? `Banco ${account.bank_code}`,
				agency: account.agency,
				account_masked: accountMasked,
				account_type: account.account_type as "checking" | "savings",
				holder_document_masked: maskDocument(user.document),
			},
			card: null,
			created_at: nowIso(),
		};
		if (isDefault) {
			for (const other of state.paymentMethods) {
				if (other.user_id === user.id) other.is_default = false;
			}
		}
		state.paymentMethods.push(method);
		commit();

		setTimeout(() => {
			method.status = "verified";
			commit();
		}, 5000);

		return json(withoutOwner(method), 201);
	}

	const token = String(payload.card_token ?? "");
	const method: MockPaymentMethod = {
		id: `pm_${newId()}`,
		user_id: user.id,
		type: "card",
		is_default: isDefault,
		status: "verified",
		bank_account: null,
		card: {
			brand: CARD_BRANDS[token.length % CARD_BRANDS.length],
			last4: token.slice(-4).padStart(4, "0"),
			exp_month: 12,
			exp_year: new Date().getFullYear() + 4,
			holder_name: user.full_name.toUpperCase(),
		},
		created_at: nowIso(),
	};
	if (isDefault) {
		for (const other of state.paymentMethods) {
			if (other.user_id === user.id) other.is_default = false;
		}
	}
	state.paymentMethods.push(method);
	commit();

	return json(withoutOwner(method), 201);
});

route("GET", "/payment-methods/:paymentMethodId", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const method = db().paymentMethods.find(
		(candidate) =>
			candidate.id === context.params.paymentMethodId && candidate.user_id === user.id,
	);
	return method ? json(withoutOwner(method)) : notFound();
});

route("PATCH", "/payment-methods/:paymentMethodId", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const state = db();
	const method = state.paymentMethods.find(
		(candidate) =>
			candidate.id === context.params.paymentMethodId && candidate.user_id === user.id,
	);
	if (!method) return notFound();

	const payload = await context.body();
	if (payload.is_default === true) {
		for (const other of state.paymentMethods) {
			if (other.user_id === user.id) other.is_default = false;
		}
		method.is_default = true;
	}
	if (method.card && payload.exp_month) method.card.exp_month = Number(payload.exp_month);
	if (method.card && payload.exp_year) method.card.exp_year = Number(payload.exp_year);
	commit();

	return json(withoutOwner(method));
});

route("DELETE", "/payment-methods/:paymentMethodId", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const state = db();
	const index = state.paymentMethods.findIndex(
		(candidate) =>
			candidate.id === context.params.paymentMethodId && candidate.user_id === user.id,
	);
	if (index < 0) return notFound();

	const inUse = state.transactions.find(
		(transaction) =>
			transaction.status === "processing" &&
			transaction.metadata.account_masked ===
				state.paymentMethods[index].bank_account?.account_masked,
	);
	if (inUse) {
		return fail(
			409,
			"payment_method_in_use",
			"Existe um saque em processamento vinculado a este método.",
			[{ field: "transaction_id", issue: inUse.id }],
		);
	}

	state.paymentMethods.splice(index, 1);
	commit();
	return noContent();
});
