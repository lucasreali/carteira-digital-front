/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** `"true"` liga o mock em memória no lugar da API. */
	readonly VITE_ENABLE_MOCK_API?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
