import { apiBaseUrl, mockApiEnabled } from "../config";
import { matchRoute } from "./router";

import "./handlers/auth";
import "./handlers/users";
import "./handlers/wallets";
import "./handlers/transactions";
import "./handlers/payment-methods";
import "./handlers/pix";
import "./handlers/beneficiaries";
import "./handlers/webhooks";

const MIN_LATENCY_MS = 120;
const MAX_LATENCY_MS = 320;

let installed = false;

function simulateLatency() {
	const delay = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
	return new Promise((resolve) => setTimeout(resolve, delay));
}

function baseUrl() {
	const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
	return new URL(apiBaseUrl, origin);
}

async function readBody(request: Request) {
	try {
		return (await request.clone().json()) as Record<string, unknown>;
	} catch {
		return {};
	}
}

export function installMockApi() {
	if (installed || !mockApiEnabled) return;
	installed = true;

	const base = baseUrl();
	const passthrough = globalThis.fetch.bind(globalThis);

	globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const request = new Request(input, init);
		const url = new URL(request.url);
		const targetsApi = url.origin === base.origin && url.pathname.startsWith(base.pathname);
		if (!targetsApi) return passthrough(input, init);

		const pathname = url.pathname.slice(base.pathname.length) || "/";
		const matched = matchRoute(request.method, pathname);
		await simulateLatency();

		if (!matched) {
			return new Response(
				JSON.stringify({
					error: {
						code: "not_found",
						message: `Rota não implementada no mock: ${request.method} ${pathname}`,
						details: [],
						trace_id: "mock",
					},
				}),
				{ status: 404, headers: { "Content-Type": "application/json" } },
			);
		}

		return matched.handler({
			request,
			params: matched.params,
			query: url.searchParams,
			body: () => readBody(request),
		});
	};
}

export { resetDb } from "./db";
