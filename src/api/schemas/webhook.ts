import { z } from "zod";

export const webhookEventSchema = z.enum([
	"transaction.created",
	"transaction.completed",
	"transaction.failed",
	"transaction.reversed",
	"deposit.confirmed",
	"withdrawal.settled",
	"pix.charge.paid",
	"kyc.updated",
]);

export type WebhookEvent = z.infer<typeof webhookEventSchema>;

export const webhookSubscriptionSchema = z.object({
	id: z.string(),
	url: z.string(),
	events: z.array(z.string()),
	status: z.enum(["active", "disabled"]),
	secret_masked: z.string(),
	created_at: z.string(),
});

export type WebhookSubscription = z.infer<typeof webhookSubscriptionSchema>;

export const createdWebhookSchema = webhookSubscriptionSchema.extend({
	secret: z.string(),
});

export const createWebhookFormSchema = z.object({
	url: z
		.url("URL inválida")
		.refine((value) => value.startsWith("https://"), "A URL do webhook precisa usar HTTPS"),
	events: z.array(webhookEventSchema).min(1, "Selecione ao menos um evento"),
});

export type CreateWebhookForm = z.infer<typeof createWebhookFormSchema>;
