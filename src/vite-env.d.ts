/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Base URL da API de carteira digital, incluindo o prefixo `/v1`. */
	readonly VITE_API_URL?: string;
	/** `"false"` desliga o mock em memória e fala com a API real. */
	readonly VITE_ENABLE_MOCK_API?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
