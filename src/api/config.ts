const fallbackBaseUrl = "http://localhost:3000/v1";

// Acesso estático (e não por chave dinâmica) para que o Vite substitua os valores
// em tempo de build: é o que permite eliminar o mock do bundle de produção.
export const apiBaseUrl = import.meta.env.VITE_API_URL ?? fallbackBaseUrl;

export const mockApiEnabled = import.meta.env.VITE_ENABLE_MOCK_API !== "false";
