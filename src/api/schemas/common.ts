import { z } from "zod";

import { Money } from "@/domain/money";

// O contrato declara os identificadores como UUID, mas o mock que responde ao
// app publicado gera valores aleatórios fora desse formato. A resposta valida a
// forma; conferir o formato é responsabilidade do servidor real.
export const idField = z.string();

export const paginationSchema = z.object({
	next_cursor: z.string().nullable(),
	has_more: z.boolean(),
	limit: z.number().int(),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const errorDetailSchema = z.object({
	field: z.string().optional(),
	issue: z.string().optional(),
});

export const errorEnvelopeSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.array(errorDetailSchema).optional(),
		trace_id: z.string().optional(),
	}),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export function pageOf<TItem extends z.ZodType>(item: TItem) {
	return z.object({ data: z.array(item), pagination: paginationSchema });
}

export function listOf<TItem extends z.ZodType>(item: TItem) {
	return z.object({ data: z.array(item) });
}

export function centsField(minimumCents: number) {
	return z
		.string()
		.trim()
		.min(1, "Informe o valor")
		.transform((raw, ctx) => {
			const money = Money.parse(raw);
			if (!money) {
				ctx.addIssue({ code: "custom", message: "Valor inválido" });
				return z.NEVER;
			}
			if (money.toCents() < minimumCents) {
				ctx.addIssue({
					code: "custom",
					message: `Valor mínimo de ${Money.fromCents(minimumCents)}`,
				});
				return z.NEVER;
			}
			return money.toCents();
		});
}

export function optionalText(maximumLength: number) {
	return z
		.string()
		.trim()
		.max(maximumLength, `Máximo de ${maximumLength} caracteres`)
		.optional()
		.transform((value) => value || undefined);
}
