import { newIdempotencyKey, request } from "@/api/http";
import { pageOf } from "@/api/schemas/common";
import { transactionSchema } from "@/api/schemas/transaction";

export type TransactionFilters = {
	wallet_id?: string;
	type?: string;
	status?: string;
	from?: string;
	to?: string;
	min_amount?: number;
	max_amount?: number;
	limit?: number;
	cursor?: string;
};

export type DepositPayload = {
	amount: number;
	method: "pix" | "card" | "boleto";
	payment_method_id?: string;
	description?: string;
};

export type WithdrawalPayload = {
	amount: number;
	payment_method_id: string;
	description?: string;
};

export type TransferPayload = {
	source_wallet_id: string;
	destination_wallet_id?: string;
	destination_email?: string;
	destination_document?: string;
	amount: number;
	description?: string;
	scheduled_for?: string;
};

export type ReversalPayload = {
	amount?: number;
	reason: "fraud" | "duplicate" | "customer_request" | "operational_error";
};

export const transactionEndpoints = {
	list: (query: TransactionFilters = {}) =>
		request({
			path: "/transactions",
			query,
			schema: pageOf(transactionSchema),
		}),

	get: (transactionId: string) =>
		request({
			path: `/transactions/${transactionId}`,
			schema: transactionSchema,
		}),

	deposit: (walletId: string, body: DepositPayload) =>
		request({
			path: `/wallets/${walletId}/deposits`,
			method: "POST",
			body,
			schema: transactionSchema,
			idempotencyKey: newIdempotencyKey("dep"),
		}),

	withdraw: (walletId: string, body: WithdrawalPayload) =>
		request({
			path: `/wallets/${walletId}/withdrawals`,
			method: "POST",
			body,
			schema: transactionSchema,
			idempotencyKey: newIdempotencyKey("wd"),
		}),

	transfer: (body: TransferPayload) =>
		request({
			path: "/transfers",
			method: "POST",
			body,
			schema: transactionSchema,
			idempotencyKey: newIdempotencyKey("trf"),
		}),

	reverse: (transactionId: string, body: ReversalPayload) =>
		request({
			path: `/transactions/${transactionId}/reversal`,
			method: "POST",
			body,
			schema: transactionSchema,
			idempotencyKey: newIdempotencyKey("rev"),
		}),
};
