import type { z } from "zod";

import { usersFunctionBaseUrl } from "./config";
import { functionCallLog } from "./function-call-log";
import { ApiError } from "./http";
import { functionErrorSchema } from "./schemas/function-user";

const UNREACHABLE =
	"Não foi possível alcançar a Azure Function. Verifique a conexão e a liberação de CORS para esta origem.";

type FunctionRequestOptions<TSchema extends z.ZodType | undefined> = {
	path: string;
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
	schema?: TSchema;
};

async function send(options: FunctionRequestOptions<z.ZodType | undefined>) {
	const method = options.method ?? "GET";
	const startedAt = Date.now();
	const record = (status: number | null) =>
		functionCallLog.record({
			method,
			path: options.path,
			status,
			milliseconds: Date.now() - startedAt,
		});

	const response = await fetch(`${usersFunctionBaseUrl}${options.path}`, {
		method,
		headers:
			options.body === undefined
				? undefined
				: { "Content-Type": "application/json" },
		body: options.body === undefined ? undefined : JSON.stringify(options.body),
	}).catch(() => {
		record(null);
		throw new ApiError(0, "function_unreachable", UNREACHABLE);
	});

	record(response.status);
	return response;
}

async function failureFrom(response: Response) {
	const payload = await response.json().catch(() => null);
	const parsed = functionErrorSchema.safeParse(payload);
	return new ApiError(
		response.status,
		"function_error",
		parsed.success
			? parsed.data.error
			: `A função respondeu com status ${response.status}.`,
	);
}

export async function functionRequest<TSchema extends z.ZodType>(
	options: FunctionRequestOptions<TSchema>,
): Promise<z.infer<TSchema>>;
export async function functionRequest(
	options: FunctionRequestOptions<undefined>,
): Promise<void>;
export async function functionRequest(
	options: FunctionRequestOptions<z.ZodType | undefined>,
) {
	const response = await send(options);

	if (!response.ok) throw await failureFrom(response);
	if (response.status === 204 || !options.schema) return undefined;

	return options.schema.parse(await response.json());
}
