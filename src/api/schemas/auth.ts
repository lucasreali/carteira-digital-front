import { z } from "zod";

import { Phone } from "@/domain/phone";
import { documentField, userSchema } from "./user";

export const tokenPairSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string(),
	token_type: z.string(),
	expires_in: z.number().int(),
});

export const authSessionSchema = tokenPairSchema.extend({ user: userSchema });

export type AuthSession = z.infer<typeof authSessionSchema>;

export const loginFormSchema = z.object({
	email: z.email("E-mail inválido"),
	password: z.string().min(1, "Informe a senha"),
});

export type LoginForm = z.infer<typeof loginFormSchema>;

const passwordField = z
	.string()
	.min(10, "A senha precisa ter ao menos 10 caracteres")
	.refine((value) => /[A-Za-z]/.test(value), "Inclua ao menos uma letra")
	.refine((value) => /\d/.test(value), "Inclua ao menos um número")
	.refine((value) => /[^A-Za-z0-9]/.test(value), "Inclua ao menos um caractere especial");

const legalAgeInYears = 18;

function isOldEnough(birthDate: string) {
	const birth = new Date(birthDate);
	const limit = new Date();
	limit.setFullYear(limit.getFullYear() - legalAgeInYears);
	return birth <= limit;
}

export const registerFormSchema = z
	.object({
		full_name: z.string().trim().min(3, "Informe o nome completo"),
		email: z.email("E-mail inválido"),
		document: documentField,
		phone: z
			.string()
			.trim()
			.refine(Phone.isValid, "Telefone inválido")
			.transform((value) => Phone.parse(value)?.toE164() ?? value),
		birth_date: z
			.string()
			.min(1, "Informe a data de nascimento")
			.refine(isOldEnough, "É necessário ter ao menos 18 anos"),
		password: passwordField,
		password_confirmation: z.string().min(1, "Confirme a senha"),
		accepted_terms: z.literal(true, { error: "Aceite os termos para continuar" }),
	})
	.refine((values) => values.password === values.password_confirmation, {
		path: ["password_confirmation"],
		message: "As senhas não conferem",
	});

export type RegisterForm = z.input<typeof registerFormSchema>;
