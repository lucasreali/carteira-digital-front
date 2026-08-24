import { request } from "@/api/http";
import { pageOf } from "@/api/schemas/common";
import { statementSchema } from "@/api/schemas/transaction";
import { balanceSchema, walletSchema } from "@/api/schemas/wallet";

export type WalletListFilters = {
	currency?: string;
	status?: string;
	limit?: number;
	cursor?: string;
};

export type StatementFilters = {
	from?: string;
	to?: string;
	limit?: number;
	cursor?: string;
};

export const walletEndpoints = {
	list: (query: WalletListFilters = {}) =>
		request({ path: "/wallets", query, schema: pageOf(walletSchema) }),

	create: (body: { alias: string; currency: string; is_default: boolean }) =>
		request({ path: "/wallets", method: "POST", body, schema: walletSchema }),

	get: (walletId: string) => request({ path: `/wallets/${walletId}`, schema: walletSchema }),

	update: (
		walletId: string,
		body: { alias?: string; is_default?: boolean; status?: "active" | "frozen" },
		version?: number,
	) =>
		request({
			path: `/wallets/${walletId}`,
			method: "PATCH",
			body,
			schema: walletSchema,
			ifMatch: version,
		}),

	close: (walletId: string) => request({ path: `/wallets/${walletId}`, method: "DELETE" }),

	balance: (walletId: string) =>
		request({ path: `/wallets/${walletId}/balance`, schema: balanceSchema }),

	statement: (walletId: string, query: StatementFilters = {}) =>
		request({ path: `/wallets/${walletId}/statement`, query, schema: statementSchema }),
};
