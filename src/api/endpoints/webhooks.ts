import { request } from "@/api/http";
import { listOf } from "@/api/schemas/common";
import {
	createdWebhookSchema,
	webhookSubscriptionSchema,
} from "@/api/schemas/webhook";

export const webhookEndpoints = {
	list: () =>
		request({
			path: "/webhooks/subscriptions",
			schema: listOf(webhookSubscriptionSchema),
		}),

	create: (body: { url: string; events: ReadonlyArray<string> }) =>
		request({
			path: "/webhooks/subscriptions",
			method: "POST",
			body,
			schema: createdWebhookSchema,
		}),

	remove: (webhookId: string) =>
		request({ path: `/webhooks/subscriptions/${webhookId}`, method: "DELETE" }),
};
