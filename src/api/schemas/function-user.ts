import { z } from "zod";

// Contrato da API de usuários em Azure Functions: identificadores são ObjectId
// do MongoDB e a falha vem num envelope de campo único, diferente do da carteira.
export const objectIdField = z
	.string()
	.trim()
	.regex(/^[0-9a-fA-F]{24}$/, "ObjectId tem 24 caracteres hexadecimais");

export const functionErrorSchema = z.object({ error: z.string() });

export const functionUserSchema = z.object({
	_id: z.string(),
	nome: z.string(),
	email: z.string(),
	criadoEm: z.string().nullish(),
	atualizadoEm: z.string().nullish(),
});

export type FunctionUser = z.infer<typeof functionUserSchema>;

export const functionUserFormSchema = z.object({
	nome: z.string().trim().min(2, "Informe o nome"),
	email: z.email("E-mail inválido"),
});

export type FunctionUserForm = z.infer<typeof functionUserFormSchema>;

export const findFunctionUserFormSchema = z.object({ id: objectIdField });

export type FindFunctionUserForm = z.infer<typeof findFunctionUserFormSchema>;
