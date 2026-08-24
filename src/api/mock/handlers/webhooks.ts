import type { MockWebhook } from "../db";
import { commit, db, newId, nowIso } from "../db";
import { route } from "../router";
import { notFound, requireUser, unauthorized } from "../shared";
import { fail, json, noContent } from "../support";

function toSubscription(webhook: MockWebhook) {
	return {
		id: webhook.id,
		url: webhook.url,
		events: webhook.events,
		status: webhook.status,
		secret_masked: `whsec_****${webhook.secret.slice(-4)}`,
		created_at: webhook.created_at,
	};
}

route("GET", "/webhooks/subscriptions", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const subscriptions = db()
		.webhooks.filter((webhook) => webhook.user_id === user.id)
		.map(toSubscription);
	return json({ data: subscriptions });
});

route("POST", "/webhooks/subscriptions", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const payload = await context.body();
	const url = String(payload.url ?? "");
	if (!url.startsWith("https://")) {
		return fail(
			422,
			"invalid_webhook_url",
			"A URL do webhook precisa usar HTTPS.",
			[{ field: "url", issue: "esquema http não permitido" }],
		);
	}

	const webhook: MockWebhook = {
		id: `wh_${newId()}`,
		user_id: user.id,
		url,
		events: (payload.events as Array<string>) ?? [],
		status: "active",
		secret: `whsec_${newId().replace(/-/g, "")}`,
		created_at: nowIso(),
	};
	db().webhooks.push(webhook);
	commit();

	return json({ ...toSubscription(webhook), secret: webhook.secret }, 201);
});

route("DELETE", "/webhooks/subscriptions/:webhookId", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const state = db();
	const index = state.webhooks.findIndex(
		(webhook) =>
			webhook.id === context.params.webhookId && webhook.user_id === user.id,
	);
	if (index < 0) return notFound();

	state.webhooks.splice(index, 1);
	commit();
	return noContent();
});
