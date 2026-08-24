import { apiBaseUrl, mockApiEnabled } from "../config";

const MIN_LATENCY_MS = 120;
const MAX_LATENCY_MS = 320;

let installed = false;

function simulateLatency() {
	const delay =
		MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
	return new Promise((resolve) => setTimeout(resolve, delay));
}

function baseUrl() {
	const origin =
		typeof window === "undefined" ? "http://localhost" : window.location.origin;
	return new URL(apiBaseUrl, origin);
}

// Carregado sob demanda: com o mock desligado o `import()` fica inalcançável e o
// bundler descarta os handlers e os dados de seed.
function loadRouter() {
	return import("./handlers");
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
	const routerReady = loadRouter();

	globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const request = new Request(input, init);
		const url = new URL(request.url);
		const targetsApi =
			url.origin === base.origin && url.pathname.startsWith(base.pathname);
		if (!targetsApi) return passthrough(input, init);

		const pathname = url.pathname.slice(base.pathname.length) || "/";
		const { matchRoute } = await routerReady;
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
