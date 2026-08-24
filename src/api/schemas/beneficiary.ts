import { z } from "zod";

import { Document } from "@/domain/document";
import { Phone } from "@/domain/phone";

export const beneficiarySchema = z.object({
	id: z.string(),
	nickname: z.string(),
	full_name: z.string(),
	document_masked: z.string(),
	pix_key: z.string().nullable(),
	bank_code: z.string().nullable(),
	is_favorite: z.boolean(),
	created_at: z.string(),
});

export type Beneficiary = z.infer<typeof beneficiarySchema>;

function looksLikePixKey(value: string) {
	if (z.email().safeParse(value).success) return true;
	if (z.uuid().safeParse(value).success) return true;
	if (Phone.isValid(value)) return true;
	return Document.isValid(value);
}

export const createBeneficiaryFormSchema = z
	.object({
		nickname: z.string().trim().min(2, "Informe um apelido"),
		pix_key: z.string().trim().default(""),
		bank_code: z.string().trim().default(""),
		agency: z.string().trim().default(""),
		account_number: z.string().trim().default(""),
		is_favorite: z.boolean().default(false),
	})
	.superRefine((values, ctx) => {
		const hasBankAccount = Boolean(
			values.bank_code && values.agency && values.account_number,
		);
		if (!values.pix_key && !hasBankAccount) {
			ctx.addIssue({
				path: ["pix_key"],
				code: "custom",
				message: "Informe uma chave Pix ou os dados bancários completos",
			});
			return;
		}
		if (values.pix_key && !looksLikePixKey(values.pix_key)) {
			ctx.addIssue({
				path: ["pix_key"],
				code: "custom",
				message: "Chave Pix inválida",
			});
		}
		if (values.bank_code && !/^\d{3}$/.test(values.bank_code)) {
			ctx.addIssue({
				path: ["bank_code"],
				code: "custom",
				message: "Código do banco com 3 dígitos",
			});
		}
	})
	.transform((values) => ({
		nickname: values.nickname,
		pix_key: values.pix_key || undefined,
		bank_code: values.bank_code || undefined,
		agency: values.agency || undefined,
		account_number: values.account_number || undefined,
		is_favorite: values.is_favorite,
	}));

export type CreateBeneficiaryForm = z.input<typeof createBeneficiaryFormSchema>;

export const updateBeneficiaryFormSchema = z.object({
	nickname: z.string().trim().min(2, "Informe um apelido"),
	is_favorite: z.boolean(),
});

export type UpdateBeneficiaryForm = z.infer<typeof updateBeneficiaryFormSchema>;
