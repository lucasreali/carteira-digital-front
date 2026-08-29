import { statusFunctionUrl } from "@/api/config";

const UNREACHABLE =
	"Não foi possível alcançar a função. Verifique a conexão e a liberação de CORS para esta origem.";

function statusUrl(name: string) {
	const url = new URL(statusFunctionUrl);
	url.searchParams.set("name", name);
	return url;
}

export async function fetchServiceStatus(name: string) {
	const response = await fetch(statusUrl(name)).catch(() => {
		throw new Error(UNREACHABLE);
	});

	if (!response.ok) {
		throw new Error(`A função respondeu com status ${response.status}.`);
	}

	return (await response.text()).trim();
}
