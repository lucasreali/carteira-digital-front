import { newIdempotencyKey, request } from "@/api/http";
import { listOf } from "@/api/schemas/common";
import { pixChargeSchema, pixKeySchema } from "@/api/schemas/pix";
import { transactionSchema } from "@/api/schemas/transaction";

export type CreatePixKeyPayload = {
	type: "cpf" | "cnpj" | "email" | "phone" | "random";
	value?: string;
	wallet_id: string;
};

export type CreatePixChargePayload = {
	wallet_id: string;
	amount: number;
	expires_in?: number;
	description?: string;
};

export type PixPaymentPayload = {
	source_wallet_id: string;
	pix_key?: string;
	qr_code?: string;
	amount?: number;
	description?: string;
};

export const pixEndpoints = {
	listKeys: () => request({ path: "/pix/keys", schema: listOf(pixKeySchema) }),

	createKey: (body: CreatePixKeyPayload) =>
		request({ path: "/pix/keys", method: "POST", body, schema: pixKeySchema }),

	removeKey: (pixKeyId: string) =>
		request({ path: `/pix/keys/${pixKeyId}`, method: "DELETE" }),

	createCharge: (body: CreatePixChargePayload) =>
		request({
			path: "/pix/charges",
			method: "POST",
			body,
			schema: pixChargeSchema,
			idempotencyKey: newIdempotencyKey("chg"),
		}),

	getCharge: (chargeId: string) =>
		request({ path: `/pix/charges/${chargeId}`, schema: pixChargeSchema }),

	cancelCharge: (chargeId: string) =>
		request({ path: `/pix/charges/${chargeId}`, method: "DELETE" }),

	pay: (body: PixPaymentPayload) =>
		request({
			path: "/pix/payments",
			method: "POST",
			body,
			schema: transactionSchema,
			idempotencyKey: newIdempotencyKey("pix"),
		}),
};
