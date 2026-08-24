import { request } from "@/api/http";
import { pageOf } from "@/api/schemas/common";
import { paymentMethodSchema } from "@/api/schemas/payment-method";

export type CreatePaymentMethodPayload = {
	type: "card" | "bank_account";
	is_default: boolean;
	card_token?: string;
	bank_account?: {
		bank_code: string;
		agency: string;
		account_number: string;
		account_digit: string;
		account_type: "checking" | "savings";
	};
};

export const paymentMethodEndpoints = {
	list: (query: { type?: string; limit?: number; cursor?: string } = {}) =>
		request({ path: "/payment-methods", query, schema: pageOf(paymentMethodSchema) }),

	create: (body: CreatePaymentMethodPayload) =>
		request({ path: "/payment-methods", method: "POST", body, schema: paymentMethodSchema }),

	get: (paymentMethodId: string) =>
		request({ path: `/payment-methods/${paymentMethodId}`, schema: paymentMethodSchema }),

	update: (
		paymentMethodId: string,
		body: { is_default?: boolean; exp_month?: number; exp_year?: number },
	) =>
		request({
			path: `/payment-methods/${paymentMethodId}`,
			method: "PATCH",
			body,
			schema: paymentMethodSchema,
		}),

	remove: (paymentMethodId: string) =>
		request({ path: `/payment-methods/${paymentMethodId}`, method: "DELETE" }),
};
