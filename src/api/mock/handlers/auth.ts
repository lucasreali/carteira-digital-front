import type { MockUser } from "../db";
import { commit, db, newId, nowIso } from "../db";
import { route } from "../router";
import { unauthorized } from "../shared";
import { authenticate, fail, issueSession, json, noContent, toUser } from "../support";

route("POST", "/auth/register", async ({ body }) => {
	const payload = await body();
	const email = String(payload.email ?? "").toLowerCase();
	const document = String(payload.document ?? "");
	const state = db();

	if (state.users.some((user) => user.email === email)) {
		return fail(409, "resource_conflict", "Já existe um usuário com este e-mail.");
	}
	if (state.users.some((user) => user.document === document)) {
		return fail(409, "resource_conflict", "Já existe um usuário com este CPF.");
	}

	const user: MockUser = {
		id: newId(),
		full_name: String(payload.full_name ?? ""),
		email,
		document,
		phone: String(payload.phone ?? ""),
		password: String(payload.password ?? ""),
		birth_date: String(payload.birth_date ?? ""),
		status: "active",
		kyc_status: "pending",
		created_at: nowIso(),
		updated_at: nowIso(),
		version: 1,
	};

	state.users.push(user);
	state.kyc.push({
		user_id: user.id,
		status: "pending",
		level: 0,
		submitted_at: null,
		reviewed_at: null,
		rejection_reason: null,
		limits: { daily_transfer_limit: 100000, nightly_transfer_limit: 50000 },
	});
	state.wallets.push({
		id: newId(),
		user_id: user.id,
		alias: "Conta principal",
		currency: "BRL",
		available_balance: 0,
		blocked_balance: 0,
		is_default: true,
		status: "active",
		created_at: nowIso(),
		updated_at: nowIso(),
		version: 1,
	});
	commit();

	return json({ ...issueSession(user), user: toUser(user) }, 201);
});

route("POST", "/auth/login", async ({ body }) => {
	const payload = await body();
	const email = String(payload.email ?? "").toLowerCase();
	const user = db().users.find((candidate) => candidate.email === email);

	if (!user || user.password !== payload.password) {
		return fail(401, "invalid_credentials", "E-mail ou senha incorretos.");
	}
	if (user.status === "blocked") {
		return fail(403, "account_blocked", "Conta suspensa por análise de risco. Contate o suporte.");
	}

	return json({ ...issueSession(user), user: toUser(user) });
});

route("POST", "/auth/refresh", async ({ body }) => {
	const payload = await body();
	const state = db();
	const token = String(payload.refresh_token ?? "");
	const user = state.users.find((candidate) => candidate.id === state.refreshTokens[token]);

	if (!user) {
		return fail(
			401,
			"invalid_refresh_token",
			"Refresh token inválido ou já utilizado. Faça login novamente.",
		);
	}

	delete state.refreshTokens[token];
	return json(issueSession(user));
});

route("POST", "/auth/logout", async ({ request, body }) => {
	const user = authenticate(request);
	if (!user) return unauthorized();

	const payload = await body();
	const state = db();
	for (const [token, userId] of Object.entries(state.refreshTokens)) {
		if (userId === user.id && payload.all_devices !== false) delete state.refreshTokens[token];
	}
	commit();

	return noContent();
});
