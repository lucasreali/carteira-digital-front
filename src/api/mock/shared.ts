import type { MockTransaction, MockUser, MockWallet } from "./db";
import { commit, db } from "./db";
import { authenticate, fail, json } from "./support";
import type { MockContext } from "./router";

export const SETTLEMENT_DELAY_MS = 6000;
export const CHARGE_PAYMENT_DELAY_MS = 12000;

export function requireUser(context: MockContext) {
	return authenticate(context.request);
}

export function unauthorized() {
	return fail(401, "unauthorized", "Token de acesso expirado.");
}

export function notFound() {
	return fail(404, "not_found", "Recurso não encontrado.");
}

export function walletsOf(user: MockUser) {
	return db().wallets.filter((wallet) => wallet.user_id === user.id && wallet.status !== "closed");
}

export function findWallet(user: MockUser, walletId: string) {
	return walletsOf(user).find((wallet) => wallet.id === walletId) ?? null;
}

export function totalOf(wallet: MockWallet) {
	return wallet.available_balance + wallet.blocked_balance;
}

export function toTransaction(transaction: MockTransaction) {
	const { user_id: _ownerId, ...rest } = transaction;
	return rest;
}

export function pushTransaction(transaction: MockTransaction) {
	db().transactions.unshift(transaction);
	return transaction;
}

export function insufficientFunds(requested: number, available: number) {
	return fail(422, "insufficient_funds", "Saldo insuficiente para concluir a operação.", [
		{ field: "amount", issue: `solicitado: ${requested}, disponível: ${available}` },
	]);
}

export function idempotencyReplay(request: Request, payload: unknown) {
	const key = request.headers.get("Idempotency-Key");
	if (!key) return { key: null, replay: null };
	const stored = db().idempotency[key];
	if (!stored) return { key, replay: null };
	if (stored.body !== JSON.stringify(payload ?? {})) {
		return {
			key,
			replay: fail(
				409,
				"idempotency_key_reuse",
				"Esta Idempotency-Key já foi usada com um payload diferente.",
				[{ field: "Idempotency-Key", issue: key }],
			),
		};
	}
	return { key, replay: json(JSON.parse(stored.response), stored.status) };
}

export function rememberIdempotency(
	key: string | null,
	payload: unknown,
	response: unknown,
	status: number,
) {
	if (!key) return;
	db().idempotency[key] = {
		body: JSON.stringify(payload ?? {}),
		response: JSON.stringify(response),
		status,
	};
	commit();
}
