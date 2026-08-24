import type { z } from "zod";

import { sessionFrom, sessionStore } from "@/auth/session";
import { apiBaseUrl } from "./config";
import { errorEnvelopeSchema } from "./schemas/common";
import { tokenPairSchema } from "./schemas/auth";

export type ApiErrorDetail = { field?: string; issue?: string };

export class ApiError extends Error {
	readonly status: number;
	readonly code: string;
	readonly details: ReadonlyArray<ApiErrorDetail>;
	readonly traceId?: string;

	constructor(
		status: number,
		code: string,
		message: string,
		details: ReadonlyArray<ApiErrorDetail> = [],
		traceId?: string,
	) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
		this.details = details;
		this.traceId = traceId;
	}

	static async fromResponse(response: Response) {
		const payload = await response.json().catch(() => null);
		const parsed = errorEnvelopeSchema.safeParse(payload);
		if (!parsed.success) {
			return new ApiError(
				response.status,
				"unexpected_error",
				"Não foi possível concluir a operação. Tente novamente.",
			);
		}
		const { code, message, details, trace_id } = parsed.data.error;
		return new ApiError(response.status, code, message, details ?? [], trace_id);
	}

	fieldIssues() {
		const issues: Record<string, string> = {};
		for (const detail of this.details) {
			if (detail.field && detail.issue) issues[detail.field] = detail.issue;
		}
		return issues;
	}
}

type QueryValue = string | number | boolean | undefined | null;

type RequestOptions<TSchema extends z.ZodType | undefined> = {
	path: string;
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	query?: Record<string, QueryValue>;
	body?: unknown;
	formData?: FormData;
	schema?: TSchema;
	idempotencyKey?: string;
	ifMatch?: string | number;
	anonymous?: boolean;
};

export function newIdempotencyKey(prefix: string) {
	const random =
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? crypto.randomUUID()
			: Math.random().toString(36).slice(2);
	return `${prefix}_${random}`.slice(0, 64);
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
	const url = new URL(`${apiBaseUrl}${path}`, "http://localhost");
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value === undefined || value === null || value === "") continue;
			url.searchParams.set(key, String(value));
		}
	}
	return apiBaseUrl.startsWith("http") ? url.toString() : `${url.pathname}${url.search}`;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession() {
	const session = sessionStore.read();
	if (!session) return false;

	const response = await fetch(buildUrl("/auth/refresh"), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refresh_token: session.refresh_token }),
	});

	if (!response.ok) {
		sessionStore.clear();
		return false;
	}

	const tokens = tokenPairSchema.parse(await response.json());
	sessionStore.save(sessionFrom({ ...tokens, user: session.user }));
	return true;
}

function refreshOnce() {
	refreshInFlight ??= refreshSession().finally(() => {
		refreshInFlight = null;
	});
	return refreshInFlight;
}

async function send(options: RequestOptions<z.ZodType | undefined>) {
	const headers: Record<string, string> = {};
	const session = sessionStore.read();

	if (!options.anonymous && session) {
		headers.Authorization = `Bearer ${session.access_token}`;
	}
	if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
	if (options.ifMatch !== undefined) headers["If-Match"] = String(options.ifMatch);
	if (options.body !== undefined) headers["Content-Type"] = "application/json";

	return fetch(buildUrl(options.path, options.query), {
		method: options.method ?? "GET",
		headers,
		body: options.formData ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
	});
}

export async function request<TSchema extends z.ZodType>(
	options: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>>;
export async function request(options: RequestOptions<undefined>): Promise<void>;
export async function request(options: RequestOptions<z.ZodType | undefined>) {
	let response = await send(options);

	if (response.status === 401 && !options.anonymous && (await refreshOnce())) {
		response = await send(options);
	}

	if (!response.ok) throw await ApiError.fromResponse(response);
	if (response.status === 204 || !options.schema) return undefined;

	return options.schema.parse(await response.json());
}
