const fallbackBaseUrl = "http://localhost:3000/v1";

function readEnv(key: string) {
	return import.meta.env[key as keyof ImportMetaEnv] as string | undefined;
}

export const apiBaseUrl = readEnv("VITE_API_URL") ?? fallbackBaseUrl;

export const mockApiEnabled = (readEnv("VITE_ENABLE_MOCK_API") ?? "true") !== "false";
