import type { MockTransaction } from "../db";
import { commit, db, newId, nowIso } from "../db";
import { credit, debit, block, settleBlocked } from "../ledger";
import { route } from "../router";
import {
	SETTLEMENT_DELAY_MS,
	findWallet,
	idempotencyReplay,
	insufficientFunds,
	notFound,
	pushTransaction,
	rememberIdempotency,
	requireUser,
	toTransaction,
	unauthorized,
	walletsOf,
} from "../shared";
import { fail, json, paginate } from "../support";

const WITHDRAWAL_FEE = 350;

function pixQrCodeFor(amount: number) {
	return `00020126580014BR.GOV.BCB.PIX0136${newId()}5204000053039865405${(amount / 100).toFixed(2)}5802BR5909CARTEIRA6008CURITIBA62070503***6304${newId().slice(0, 4).toUpperCase()}`;
}

route("POST", "/wallets/:walletId/deposits", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const wallet = findWallet(user, context.params.walletId);
	if (!wallet) return notFound();

	const payload = await context.body();
	const { key, replay } = idempotencyReplay(context.request, payload);
	if (replay) return replay;

	const amount = Number(payload.amount ?? 0);
	if (amount < 100) {
		return fail(422, "amount_out_of_range", "Valor abaixo do mínimo permitido.", [
			{ field: "amount", issue: "mínimo: 100 (R$ 1,00)" },
		]);
	}

	const method = String(payload.method ?? "pix");
	const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
	const transaction = pushTransaction({
		id: newId(),
		user_id: user.id,
		type: "deposit",
		status: "pending",
		amount,
		fee: 0,
		net_amount: amount,
		currency: wallet.currency,
		source_wallet_id: null,
		destination_wallet_id: wallet.id,
		description: (payload.description as string) ?? "Depósito",
		metadata:
			method === "pix"
				? { method, qr_code: pixQrCodeFor(amount), expires_at: expiresAt }
				: { method, payment_method_id: payload.payment_method_id ?? null, expires_at: expiresAt },
		idempotency_key: key,
		created_at: nowIso(),
		completed_at: null,
	});
	commit();

	setTimeout(() => {
		if (transaction.status !== "pending") return;
		transaction.status = "completed";
		transaction.completed_at = nowIso();
		credit({
			wallet,
			amount,
			transactionId: transaction.id,
			type: "deposit",
			description: `Depósito via ${method}`,
		});
	}, SETTLEMENT_DELAY_MS);

	const response = toTransaction(transaction);
	rememberIdempotency(key, payload, response, 201);
	return json(response, 201);
});

route("POST", "/wallets/:walletId/withdrawals", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const wallet = findWallet(user, context.params.walletId);
	if (!wallet) return notFound();

	const payload = await context.body();
	const { key, replay } = idempotencyReplay(context.request, payload);
	if (replay) return replay;

	const amount = Number(payload.amount ?? 0);
	const total = amount + WITHDRAWAL_FEE;
	if (total > wallet.available_balance) return insufficientFunds(total, wallet.available_balance);

	const method = db().paymentMethods.find(
		(candidate) => candidate.id === payload.payment_method_id && candidate.user_id === user.id,
	);
	if (!method?.bank_account) return notFound();

	const settlement = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
	const transaction = pushTransaction({
		id: newId(),
		user_id: user.id,
		type: "withdrawal",
		status: "processing",
		amount,
		fee: WITHDRAWAL_FEE,
		net_amount: amount - WITHDRAWAL_FEE,
		currency: wallet.currency,
		source_wallet_id: wallet.id,
		destination_wallet_id: null,
		description: (payload.description as string) ?? "Saque",
		metadata: {
			bank_code: method.bank_account.bank_code,
			agency: method.bank_account.agency,
			account_masked: method.bank_account.account_masked,
			estimated_settlement: settlement,
		},
		idempotency_key: key,
		created_at: nowIso(),
		completed_at: null,
	});
	block(wallet, total);

	setTimeout(() => {
		transaction.status = "completed";
		transaction.completed_at = nowIso();
		settleBlocked({
			wallet,
			amount: total,
			transactionId: transaction.id,
			type: "withdrawal",
			description: `Saque para Banco ${method.bank_account?.bank_code} ag ${method.bank_account?.agency} cc ${method.bank_account?.account_masked}`,
		});
	}, SETTLEMENT_DELAY_MS);

	const response = toTransaction(transaction);
	rememberIdempotency(key, payload, response, 201);
	return json(response, 201);
});

route("POST", "/transfers", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const payload = await context.body();
	const { key, replay } = idempotencyReplay(context.request, payload);
	if (replay) return replay;

	const source = findWallet(user, String(payload.source_wallet_id ?? ""));
	if (!source) return notFound();

	const state = db();
	const destination = payload.destination_wallet_id
		? (state.wallets.find((wallet) => wallet.id === payload.destination_wallet_id) ?? null)
		: (() => {
				const counterparty = state.users.find(
					(candidate) =>
						candidate.email === String(payload.destination_email ?? "").toLowerCase() ||
						candidate.document === payload.destination_document,
				);
				if (!counterparty) return null;
				return state.wallets.find(
					(wallet) => wallet.user_id === counterparty.id && wallet.is_default,
				) ?? null;
			})();

	if (!destination) {
		return fail(404, "destination_not_found", "Nenhum destinatário encontrado para os dados informados.");
	}
	if (destination.id === source.id) {
		return fail(400, "bad_request", "A carteira de destino precisa ser diferente da origem.");
	}

	const amount = Number(payload.amount ?? 0);
	if (amount > source.available_balance) return insufficientFunds(amount, source.available_balance);

	const counterparty = state.users.find((candidate) => candidate.id === destination.user_id);
	const scheduled = payload.scheduled_for ? String(payload.scheduled_for) : null;
	const transaction = pushTransaction({
		id: newId(),
		user_id: user.id,
		type: "transfer",
		status: scheduled ? "pending" : "completed",
		amount,
		fee: 0,
		net_amount: amount,
		currency: source.currency,
		source_wallet_id: source.id,
		destination_wallet_id: destination.id,
		description: (payload.description as string) ?? "Transferência",
		metadata: {
			counterparty_name: counterparty?.full_name ?? "Carteira própria",
			scheduled_for: scheduled,
		},
		idempotency_key: key,
		created_at: nowIso(),
		completed_at: scheduled ? null : nowIso(),
	});

	if (!scheduled) {
		debit({
			wallet: source,
			amount,
			transactionId: transaction.id,
			type: "transfer_out",
			description: `Transferência enviada para ${counterparty?.full_name ?? destination.alias}`,
		});
		credit({
			wallet: destination,
			amount,
			transactionId: transaction.id,
			type: "transfer_in",
			description: `Transferência recebida de ${user.full_name}`,
		});
	}
	commit();

	const response = toTransaction(transaction);
	rememberIdempotency(key, payload, response, 201);
	return json(response, 201);
});

route("GET", "/transactions", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const ownedWalletIds = new Set(walletsOf(user).map((wallet) => wallet.id));
	const query = context.query;
	const walletFilter = query.get("wallet_id");
	const minAmount = query.get("min_amount");
	const maxAmount = query.get("max_amount");

	const transactions = db()
		.transactions.filter(
			(transaction) =>
				ownedWalletIds.has(transaction.source_wallet_id ?? "") ||
				ownedWalletIds.has(transaction.destination_wallet_id ?? ""),
		)
		.filter((transaction) =>
			walletFilter
				? transaction.source_wallet_id === walletFilter ||
					transaction.destination_wallet_id === walletFilter
				: true,
		)
		.filter((transaction) => {
			const type = query.get("type");
			return type ? transaction.type === type : true;
		})
		.filter((transaction) => {
			const status = query.get("status");
			return status ? transaction.status === status : true;
		})
		.filter((transaction) => {
			const from = query.get("from");
			return from ? transaction.created_at >= from : true;
		})
		.filter((transaction) => {
			const to = query.get("to");
			return to ? transaction.created_at <= to : true;
		})
		.filter((transaction) => (minAmount ? transaction.amount >= Number(minAmount) : true))
		.filter((transaction) => (maxAmount ? transaction.amount <= Number(maxAmount) : true))
		.sort((left, right) => right.created_at.localeCompare(left.created_at))
		.map(toTransaction);

	return json(paginate(transactions, query.get("limit"), query.get("cursor")));
});

route("GET", "/transactions/:transactionId", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const ownedWalletIds = new Set(walletsOf(user).map((wallet) => wallet.id));
	const transaction = db().transactions.find(
		(candidate) => candidate.id === context.params.transactionId,
	);
	if (!transaction) return notFound();
	if (
		!ownedWalletIds.has(transaction.source_wallet_id ?? "") &&
		!ownedWalletIds.has(transaction.destination_wallet_id ?? "")
	) {
		return fail(403, "forbidden", "Você não tem permissão para acessar esta transação.");
	}

	return json(toTransaction(transaction));
});

const REVERSIBLE_TYPES: ReadonlyArray<MockTransaction["type"]> = [
	"transfer",
	"pix_out",
	"pix_in",
	"deposit",
];

route("POST", "/transactions/:transactionId/reversal", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const payload = await context.body();
	const { key, replay } = idempotencyReplay(context.request, payload);
	if (replay) return replay;

	const state = db();
	const original = state.transactions.find(
		(candidate) => candidate.id === context.params.transactionId,
	);
	if (!original) return notFound();
	if (original.status !== "completed" || !REVERSIBLE_TYPES.includes(original.type)) {
		return fail(409, "transaction_not_reversible", "Esta transação não pode ser estornada.", [
			{ field: "status", issue: original.status },
		]);
	}

	const amount = Number(payload.amount ?? original.amount);
	const creditWallet = state.wallets.find((wallet) => wallet.id === original.source_wallet_id);
	const debitWallet = state.wallets.find((wallet) => wallet.id === original.destination_wallet_id);
	if (!creditWallet || !debitWallet) {
		return fail(409, "transaction_not_reversible", "Esta transação não pode ser estornada.");
	}
	if (amount > debitWallet.available_balance) {
		return insufficientFunds(amount, debitWallet.available_balance);
	}

	const reversal = pushTransaction({
		id: newId(),
		user_id: user.id,
		type: "reversal",
		status: "completed",
		amount,
		fee: 0,
		net_amount: amount,
		currency: original.currency,
		source_wallet_id: debitWallet.id,
		destination_wallet_id: creditWallet.id,
		description: `Estorno da transação ${original.id.slice(0, 8)}`,
		metadata: { original_transaction_id: original.id, reason: payload.reason ?? "customer_request" },
		idempotency_key: key,
		created_at: nowIso(),
		completed_at: nowIso(),
	});

	debit({
		wallet: debitWallet,
		amount,
		transactionId: reversal.id,
		type: "reversal_out",
		description: reversal.description ?? "Estorno",
	});
	credit({
		wallet: creditWallet,
		amount,
		transactionId: reversal.id,
		type: "reversal_in",
		description: reversal.description ?? "Estorno",
	});
	original.status = "reversed";
	commit();

	const response = toTransaction(reversal);
	rememberIdempotency(key, payload, response, 201);
	return json(response, 201);
});
