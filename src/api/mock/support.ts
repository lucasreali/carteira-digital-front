import type { MockUser, MockWallet } from "./db";
import { commit, db, newId, nowIso } from "./db";

export function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export function noContent() {
	return new Response(null, { status: 204 });
}

export function fail(
	status: number,
	code: string,
	message: string,
	details: Array<{ field?: string; issue?: string }> = [],
) {
	return json({ error: { code, message, details, trace_id: newId().slice(0, 14) } }, status);
}

export function maskDocument(digits: string) {
	if (digits.length === 14) {
		return `${digits.slice(0, 2)}.***.***/****-${digits.slice(-2)}`;
	}
	return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
}

export function toUser(user: MockUser) {
	return {
		id: user.id,
		full_name: user.full_name,
		email: user.email,
		document_masked: maskDocument(user.document),
		phone: user.phone,
		status: user.status,
		kyc_status: user.kyc_status,
		created_at: user.created_at,
		updated_at: user.updated_at,
		version: user.version,
	};
}

export function toWallet(wallet: MockWallet) {
	return {
		id: wallet.id,
		user_id: wallet.user_id,
		alias: wallet.alias,
		currency: wallet.currency,
		available_balance: wallet.available_balance,
		blocked_balance: wallet.blocked_balance,
		total_balance: wallet.available_balance + wallet.blocked_balance,
		is_default: wallet.is_default,
		status: wallet.status,
		created_at: wallet.created_at,
		updated_at: wallet.updated_at,
		version: wallet.version,
	};
}

export function authenticate(request: Request) {
	const header = request.headers.get("Authorization");
	const token = header?.replace("Bearer ", "");
	if (!token?.startsWith("mock_at_")) return null;
	const userId = token.slice("mock_at_".length).split(":")[0];
	return db().users.find((user) => user.id === userId) ?? null;
}

export function issueSession(user: MockUser) {
	const accessToken = `mock_at_${user.id}:${newId()}`;
	const refreshToken = `rt_${newId().replace(/-/g, "")}`;
	db().refreshTokens[refreshToken] = user.id;
	commit();
	return {
		access_token: accessToken,
		refresh_token: refreshToken,
		token_type: "Bearer",
		expires_in: 900,
	};
}

export function paginate<TItem>(items: ReadonlyArray<TItem>, limitRaw?: string | null, cursor?: string | null) {
	const limit = Math.min(Math.max(Number(limitRaw ?? 20) || 20, 1), 100);
	const offset = cursor ? Number(atob(cursor)) || 0 : 0;
	const slice = items.slice(offset, offset + limit);
	const nextOffset = offset + limit;
	const hasMore = nextOffset < items.length;
	return {
		data: slice,
		pagination: {
			next_cursor: hasMore ? btoa(String(nextOffset)) : null,
			has_more: hasMore,
			limit,
		},
	};
}

export function recordEntry(input: {
	wallet: MockWallet;
	transactionId: string;
	type: string;
	direction: "credit" | "debit";
	amount: number;
	description: string;
}) {
	db().entries.unshift({
		id: newId(),
		wallet_id: input.wallet.id,
		transaction_id: input.transactionId,
		type: input.type,
		direction: input.direction,
		amount: input.amount,
		balance_after: input.wallet.available_balance + input.wallet.blocked_balance,
		description: input.description,
		created_at: nowIso(),
	});
}

export function touchWallet(wallet: MockWallet) {
	wallet.updated_at = nowIso();
	wallet.version += 1;
}
