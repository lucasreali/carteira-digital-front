import { z } from "zod";

import { Document } from "@/domain/document";
import { centsField, optionalText } from "./common";

export const transactionTypeSchema = z.enum([
	"deposit",
	"withdrawal",
	"transfer",
	"pix_in",
	"pix_out",
	"reversal",
	"fee",
]);

export const transactionStatusSchema = z.enum([
	"pending",
	"processing",
	"completed",
	"failed",
	"reversed",
	"canceled",
]);

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

export const transactionSchema = z.object({
	id: z.uuid(),
	type: transactionTypeSchema,
	status: transactionStatusSchema,
	amount: z.number().int(),
	fee: z.number().int(),
	net_amount: z.number().int(),
	currency: z.string(),
	source_wallet_id: z.uuid().nullable(),
	destination_wallet_id: z.uuid().nullable(),
	description: z.string().nullable(),
	metadata: z.record(z.string(), z.unknown()).default({}),
	idempotency_key: z.string().nullable(),
	created_at: z.string(),
	completed_at: z.string().nullable(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const statementEntrySchema = z.object({
	id: z.uuid(),
	transaction_id: z.uuid(),
	type: z.string(),
	direction: z.enum(["credit", "debit"]),
	amount: z.number().int(),
	balance_after: z.number().int(),
	description: z.string(),
	created_at: z.string(),
});

export type StatementEntry = z.infer<typeof statementEntrySchema>;

export const statementSchema = z.object({
	wallet_id: z.uuid(),
	opening_balance: z.number().int(),
	closing_balance: z.number().int(),
	data: z.array(statementEntrySchema),
	pagination: z.object({
		next_cursor: z.string().nullable(),
		has_more: z.boolean(),
		limit: z.number().int(),
	}),
});

const MINIMUM_MOVEMENT_CENTS = 100;

export const depositMethodSchema = z.enum(["pix", "card", "boleto"]);

export const depositFormSchema = z
	.object({
		wallet_id: z.uuid("Selecione a carteira"),
		amount: centsField(MINIMUM_MOVEMENT_CENTS),
		method: depositMethodSchema,
		payment_method_id: z.string().optional(),
		description: optionalText(140),
	})
	.refine(
		(values) => values.method !== "card" || Boolean(values.payment_method_id),
		{
			path: ["payment_method_id"],
			message: "Selecione o cartão usado no depósito",
		},
	);

export type DepositForm = z.input<typeof depositFormSchema>;

export const withdrawalFormSchema = z.object({
	wallet_id: z.uuid("Selecione a carteira"),
	amount: centsField(MINIMUM_MOVEMENT_CENTS),
	payment_method_id: z.string().min(1, "Selecione a conta de destino"),
	description: optionalText(140),
});

export type WithdrawalForm = z.input<typeof withdrawalFormSchema>;

export const transferTargetSchema = z.enum(["wallet", "email", "document"]);

export const transferFormSchema = z
	.object({
		source_wallet_id: z.uuid("Selecione a carteira de origem"),
		target: transferTargetSchema,
		destination_wallet_id: z.string().default(""),
		destination_email: z.string().trim().default(""),
		destination_document: z.string().trim().default(""),
		amount: centsField(1),
		description: optionalText(140),
		scheduled_for: z.string().default(""),
	})
	.superRefine((values, ctx) => {
		if (values.target === "wallet" && !values.destination_wallet_id) {
			ctx.addIssue({
				path: ["destination_wallet_id"],
				code: "custom",
				message: "Selecione a carteira de destino",
			});
		}
		if (
			values.target === "email" &&
			!z.email().safeParse(values.destination_email).success
		) {
			ctx.addIssue({
				path: ["destination_email"],
				code: "custom",
				message: "E-mail inválido",
			});
		}
		if (
			values.target === "document" &&
			!Document.isValid(values.destination_document)
		) {
			ctx.addIssue({
				path: ["destination_document"],
				code: "custom",
				message: "CPF ou CNPJ inválido",
			});
		}
	})
	.transform((values) => ({
		source_wallet_id: values.source_wallet_id,
		destination_wallet_id:
			values.target === "wallet" ? values.destination_wallet_id : undefined,
		destination_email:
			values.target === "email" ? values.destination_email : undefined,
		destination_document:
			values.target === "document"
				? (Document.parse(values.destination_document)?.toDigits() ?? undefined)
				: undefined,
		amount: values.amount,
		description: values.description,
		scheduled_for: values.scheduled_for
			? new Date(values.scheduled_for).toISOString()
			: undefined,
	}));

export type TransferForm = z.input<typeof transferFormSchema>;

export const reversalReasonSchema = z.enum([
	"fraud",
	"duplicate",
	"customer_request",
	"operational_error",
]);

export const reversalFormSchema = z.object({
	reason: reversalReasonSchema,
	partial: z.boolean(),
	amount: z.string().optional(),
});

export type ReversalForm = z.infer<typeof reversalFormSchema>;
