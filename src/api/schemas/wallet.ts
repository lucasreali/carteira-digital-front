import { z } from "zod";

export const currencySchema = z.enum(["BRL", "USD", "EUR"]);
export const walletStatusSchema = z.enum(["active", "frozen", "closed"]);

export const walletSchema = z.object({
	id: z.uuid(),
	user_id: z.uuid(),
	alias: z.string(),
	currency: z.string(),
	available_balance: z.number().int(),
	blocked_balance: z.number().int(),
	total_balance: z.number().int(),
	is_default: z.boolean(),
	status: walletStatusSchema,
	created_at: z.string(),
	updated_at: z.string(),
	version: z.number().int(),
});

export type Wallet = z.infer<typeof walletSchema>;

export const balanceSchema = z.object({
	wallet_id: z.uuid(),
	currency: z.string(),
	available_balance: z.number().int(),
	blocked_balance: z.number().int(),
	pending_credits: z.number().int(),
	total_balance: z.number().int(),
	updated_at: z.string(),
});

export type Balance = z.infer<typeof balanceSchema>;

export const createWalletFormSchema = z.object({
	alias: z
		.string()
		.trim()
		.min(2, "Informe um apelido")
		.max(40, "Máximo de 40 caracteres"),
	currency: currencySchema,
	is_default: z.boolean(),
});

export type CreateWalletForm = z.infer<typeof createWalletFormSchema>;

export const updateWalletFormSchema = z.object({
	alias: z
		.string()
		.trim()
		.min(2, "Informe um apelido")
		.max(40, "Máximo de 40 caracteres"),
	is_default: z.boolean(),
	status: z.enum(["active", "frozen"]),
});

export type UpdateWalletForm = z.infer<typeof updateWalletFormSchema>;
