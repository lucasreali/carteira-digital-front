import { z } from "zod";

export const paymentMethodTypeSchema = z.enum(["card", "bank_account"]);
export const paymentMethodStatusSchema = z.enum([
	"pending_verification",
	"verified",
	"rejected",
	"expired",
]);
export const accountTypeSchema = z.enum(["checking", "savings"]);

export const paymentMethodSchema = z.object({
	id: z.string(),
	type: paymentMethodTypeSchema,
	is_default: z.boolean(),
	status: paymentMethodStatusSchema,
	bank_account: z
		.object({
			bank_code: z.string(),
			bank_name: z.string(),
			agency: z.string(),
			account_masked: z.string(),
			account_type: accountTypeSchema,
			holder_document_masked: z.string(),
		})
		.nullable(),
	card: z
		.object({
			brand: z.string(),
			last4: z.string(),
			exp_month: z.number().int(),
			exp_year: z.number().int(),
			holder_name: z.string(),
		})
		.nullable(),
	created_at: z.string(),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

const currentYear = new Date().getFullYear();

export const bankAccountFormSchema = z.object({
	type: z.literal("bank_account"),
	is_default: z.boolean(),
	bank_code: z
		.string()
		.trim()
		.regex(/^\d{3}$/, "Código do banco com 3 dígitos"),
	agency: z
		.string()
		.trim()
		.regex(/^\d{4,5}$/, "Agência com 4 ou 5 dígitos"),
	account_number: z
		.string()
		.trim()
		.regex(/^\d{4,12}$/, "Número da conta inválido"),
	account_digit: z
		.string()
		.trim()
		.regex(/^[\dxX]$/, "Dígito inválido"),
	account_type: accountTypeSchema,
});

export type BankAccountForm = z.infer<typeof bankAccountFormSchema>;

export const cardFormSchema = z.object({
	type: z.literal("card"),
	is_default: z.boolean(),
	card_token: z
		.string()
		.trim()
		.min(8, "Informe o token gerado pelo SDK do adquirente")
		.regex(/^tok_/, 'O token do adquirente começa com "tok_"'),
});

export type CardForm = z.infer<typeof cardFormSchema>;

export const updateCardExpiryFormSchema = z.object({
	exp_month: z.coerce
		.number()
		.int()
		.min(1, "Mês inválido")
		.max(12, "Mês inválido"),
	exp_year: z.coerce
		.number()
		.int()
		.min(currentYear, "Ano já expirado")
		.max(currentYear + 20, "Ano inválido"),
});

export type UpdateCardExpiryForm = z.input<typeof updateCardExpiryFormSchema>;
