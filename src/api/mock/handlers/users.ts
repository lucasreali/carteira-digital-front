import { commit, db, nowIso } from "../db";
import { route } from "../router";
import {
	notFound,
	requireUser,
	SETTLEMENT_DELAY_MS,
	totalOf,
	unauthorized,
	walletsOf,
} from "../shared";
import { fail, json, toUser } from "../support";

function kycOf(userId: string) {
	return db().kyc.find((entry) => entry.user_id === userId) ?? null;
}

function withoutOwner<TRecord extends { user_id: string }>(record: TRecord) {
	const { user_id: _ownerId, ...rest } = record;
	return rest;
}

route("GET", "/users/me", (context) => {
	const user = requireUser(context);
	return user ? json(toUser(user)) : unauthorized();
});

route("PATCH", "/users/me", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const ifMatch = context.request.headers.get("If-Match");
	if (ifMatch && Number(ifMatch) !== user.version) {
		return fail(
			409,
			"version_conflict",
			"O recurso foi modificado. Recarregue e tente novamente.",
			[
				{
					field: "version",
					issue: `esperado ${ifMatch}, atual ${user.version}`,
				},
			],
		);
	}

	const payload = await context.body();
	if (
		(payload.email || payload.password) &&
		payload.current_password !== user.password
	) {
		return fail(
			422,
			"validation_failed",
			"Não foi possível processar os dados enviados.",
			[{ field: "current_password", issue: "senha atual incorreta" }],
		);
	}

	if (payload.full_name) user.full_name = String(payload.full_name);
	if (payload.phone) user.phone = String(payload.phone);
	if (payload.email) user.email = String(payload.email).toLowerCase();
	if (payload.password) user.password = String(payload.password);
	user.updated_at = nowIso();
	user.version += 1;
	commit();

	return json(toUser(user));
});

route("DELETE", "/users/me", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const balance = walletsOf(user).reduce(
		(total, wallet) => total + totalOf(wallet),
		0,
	);
	if (balance > 0) {
		return fail(
			409,
			"account_has_balance",
			"Não é possível encerrar a conta com saldo em aberto.",
			[{ field: "balance", issue: `saldo disponível: ${balance}` }],
		);
	}

	user.status = "closing";
	commit();

	const scheduled = new Date();
	scheduled.setDate(scheduled.getDate() + 30);
	return json(
		{ status: "closing", scheduled_deletion_at: scheduled.toISOString() },
		202,
	);
});

route("GET", "/users/me/kyc", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const record = kycOf(user.id);
	return record ? json(withoutOwner(record)) : notFound();
});

route("POST", "/users/me/kyc", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const record = kycOf(user.id);
	if (!record) return notFound();
	if (record.status === "in_review") {
		return fail(
			409,
			"kyc_already_in_review",
			"Já existe uma verificação em andamento.",
		);
	}

	record.status = "in_review";
	record.level = Math.max(record.level, 1);
	record.submitted_at = nowIso();
	record.reviewed_at = null;
	record.rejection_reason = null;
	user.kyc_status = "in_review";
	commit();

	setTimeout(() => {
		record.status = "approved";
		record.level = 2;
		record.reviewed_at = nowIso();
		record.limits = {
			daily_transfer_limit: 1000000,
			nightly_transfer_limit: 100000,
		};
		user.kyc_status = "approved";
		commit();
	}, SETTLEMENT_DELAY_MS * 2);

	return json(withoutOwner(record), 202);
});
