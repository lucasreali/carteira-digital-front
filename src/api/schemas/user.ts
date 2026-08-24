import { z } from "zod";

import { Document } from "@/domain/document";
import { Phone } from "@/domain/phone";

export const userStatusSchema = z.enum(["active", "blocked", "closing", "closed"]);
export const kycStatusSchema = z.enum(["pending", "in_review", "approved", "rejected"]);

export const userSchema = z.object({
	id: z.uuid(),
	full_name: z.string(),
	email: z.email(),
	document_masked: z.string(),
	phone: z.string().nullish(),
	status: userStatusSchema,
	kyc_status: kycStatusSchema,
	created_at: z.string(),
	updated_at: z.string().optional(),
	version: z.number().int().optional(),
});

export type User = z.infer<typeof userSchema>;

export const kycSchema = z.object({
	status: kycStatusSchema,
	level: z.number().int(),
	submitted_at: z.string().nullable(),
	reviewed_at: z.string().nullable(),
	rejection_reason: z.string().nullable(),
	limits: z.object({
		daily_transfer_limit: z.number().int(),
		nightly_transfer_limit: z.number().int(),
	}),
});

export type Kyc = z.infer<typeof kycSchema>;

export const accountClosureSchema = z.object({
	status: z.string(),
	scheduled_deletion_at: z.string(),
});

export const updateProfileFormSchema = z.object({
	full_name: z.string().trim().min(3, "Informe o nome completo"),
	phone: z
		.string()
		.trim()
		.refine((value) => value === "" || Phone.isValid(value), "Telefone inválido")
		.transform((value) => (value === "" ? undefined : Phone.parse(value)?.toE164())),
});

export type UpdateProfileForm = z.input<typeof updateProfileFormSchema>;

export const changeEmailFormSchema = z.object({
	email: z.email("E-mail inválido"),
	current_password: z.string().min(1, "Informe a senha atual"),
});

export const changePasswordFormSchema = z
	.object({
		current_password: z.string().min(1, "Informe a senha atual"),
		password: z.string().min(10, "A nova senha precisa ter ao menos 10 caracteres"),
		password_confirmation: z.string().min(1, "Confirme a nova senha"),
	})
	.refine((values) => values.password === values.password_confirmation, {
		path: ["password_confirmation"],
		message: "As senhas não conferem",
	});

export const kycDocumentTypeSchema = z.enum(["cnh", "rg", "passport"]);

const fileField = (message: string) =>
	z
		.instanceof(File, { message })
		.refine((file) => file.size > 0, message)
		.refine((file) => file.size <= 10 * 1024 * 1024, "Arquivo maior que o limite de 10 MB");

export const kycSubmissionFormSchema = z.object({
	document_type: kycDocumentTypeSchema,
	document_front: fileField("Envie a frente do documento"),
	document_back: fileField("Envie o verso do documento").optional(),
	selfie: fileField("Envie a selfie"),
});

export type KycSubmissionForm = z.input<typeof kycSubmissionFormSchema>;

export const documentField = z
	.string()
	.trim()
	.min(1, "Informe o CPF ou CNPJ")
	.refine(Document.isValid, "CPF ou CNPJ inválido")
	.transform((value) => Document.parse(value)?.toDigits() ?? value);
