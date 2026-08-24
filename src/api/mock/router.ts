export type MockContext = {
	request: Request;
	params: Record<string, string>;
	query: URLSearchParams;
	body: () => Promise<Record<string, unknown>>;
};

export type MockHandler = (context: MockContext) => Promise<Response> | Response;

type MockRoute = { method: string; pattern: RegExp; keys: Array<string>; handler: MockHandler };

const routes: Array<MockRoute> = [];

export function route(method: string, template: string, handler: MockHandler) {
	const keys: Array<string> = [];
	const pattern = new RegExp(
		`^${template.replace(/:([a-zA-Z]+)/g, (_, key: string) => {
			keys.push(key);
			return "([^/]+)";
		})}$`,
	);
	routes.push({ method, pattern, keys, handler });
}

export function matchRoute(method: string, pathname: string) {
	for (const candidate of routes) {
		if (candidate.method !== method) continue;
		const match = candidate.pattern.exec(pathname);
		if (!match) continue;
		const params = Object.fromEntries(
			candidate.keys.map((key, index) => [key, decodeURIComponent(match[index + 1])]),
		);
		return { handler: candidate.handler, params };
	}
	return null;
}
