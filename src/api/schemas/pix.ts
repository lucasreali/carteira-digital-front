import { z } from "zod";

import { Document } from "@/domain/document";
import { Phone } from "@/domain/phone";
import { Money } from "@/domain/money";
import { optionalText } from "./common";

export const pixKeyTypeSchema = z.enum(["cpf", "cnpj", "email", "phone", "random"]);
export const pixKeyStatusSchema = z.enum(["active", "pending_portability", "inactive"]);

export const pixKeySchema = z.object({
	id: z.string(),
	type: pixKeyTypeSchema,
	value: z.string(),
	wallet_id: z.uuid(),
	status: pixKeyStatusSchema,
	created_at: z.string(),
});

export type PixKey = z.infer<typeof pixKeySchema>;

export const pixChargeStatusSchema = z.enum(["active", "paid", "expired", "canceled"]);

export const pixChargeSchema = z.object({
	id: z.string(),
	wallet_id: z.uuid(),
	amount: z.number().int(),
	status: pixChargeStatusSchema,
	qr_code: z.string(),
	qr_code_image_url: z.string(),
	description: z.string().nullable(),
	expires_at: z.string(),
	paid_at: z.string().nullable(),
	transaction_id: z.uuid().nullable(),
	created_at: z.string(),
});

export type PixCharge = z.infer<typeof pixChargeSchema>;

function isValidKeyValue(type: z.infer<typeof pixKeyTypeSchema>, value: string) {
	if (type === "random") return true;
	if (type === "email") return z.email().safeParse(value).success;
	if (type === "phone") return Phone.isValid(value);
	const document = Document.parse(value);
	if (!document) return false;
	return type === "cnpj" ? document.isCompany() : !document.isCompany();
}

export const createPixKeyFormSchema = z
	.object({
		type: pixKeyTypeSchema,
		value: z.string().trim(),
		wallet_id: z.uuid("Selecione a carteira"),
	})
	.superRefine((values, ctx) => {
		if (values.type === "random") return;
		if (!values.value) {
			ctx.addIssue({ path: ["value"], code: "custom", message: "Informe o valor da chave" });
			return;
		}
		if (!isValidKeyValue(values.type, values.value)) {
			ctx.addIssue({ path: ["value"], code: "custom", message: "Chave inválida para este tipo" });
		}
	});

export type CreatePixKeyForm = z.infer<typeof createPixKeyFormSchema>;

const oneHourInSeconds = 3600;

export const createPixChargeFormSchema = z
	.object({
		wallet_id: z.uuid("Selecione a carteira"),
		amount: z.string().trim().default(""),
		expires_in: z.coerce
			.number()
			.int()
			.min(60, "Mínimo de 60 segundos")
			.max(86400, "Máximo de 24 horas")
			.default(oneHourInSeconds),
		description: optionalText(140),
	})
	.superRefine((values, ctx) => {
		if (values.amount && !Money.parse(values.amount)) {
			ctx.addIssue({ path: ["amount"], code: "custom", message: "Valor inválido" });
		}
	})
	.transform((values) => ({
		wallet_id: values.wallet_id,
		amount: values.amount ? (Money.parse(values.amount)?.toCents() ?? 0) : 0,
		expires_in: values.expires_in,
		description: values.description,
	}));

export type CreatePixChargeForm = z.input<typeof createPixChargeFormSchema>;

export const pixPaymentModeSchema = z.enum(["key", "qr_code"]);

export const pixPaymentFormSchema = z
	.object({
		source_wallet_id: z.uuid("Selecione a carteira de origem"),
		mode: pixPaymentModeSchema,
		pix_key: z.string().trim().default(""),
		qr_code: z.string().trim().default(""),
		amount: z.string().trim().default(""),
		description: optionalText(140),
	})
	.superRefine((values, ctx) => {
		if (values.amount && !Money.parse(values.amount)) {
			ctx.addIssue({ path: ["amount"], code: "custom", message: "Valor inválido" });
		}
		if (values.mode === "qr_code") {
			if (!values.qr_code) {
				ctx.addIssue({ path: ["qr_code"], code: "custom", message: "Cole o código copia-e-cola" });
			}
			return;
		}
		if (!values.pix_key) {
			ctx.addIssue({ path: ["pix_key"], code: "custom", message: "Informe a chave Pix" });
		}
		if (!values.amount) {
			ctx.addIssue({ path: ["amount"], code: "custom", message: "Informe o valor" });
		}
	})
	.transform((values) => ({
		source_wallet_id: values.source_wallet_id,
		pix_key: values.mode === "key" ? values.pix_key : undefined,
		qr_code: values.mode === "qr_code" ? values.qr_code : undefined,
		amount: values.amount ? Money.parse(values.amount)?.toCents() : undefined,
		description: values.description,
	}));

export type PixPaymentForm = z.input<typeof pixPaymentFormSchema>;
