// Mock server do contrato publicado no Apidog: responde as rotas do OpenAPI
// direto na raiz, sem o prefixo /v1 dos servidores reais.
export const apiBaseUrl = "https://mock.apidog.com/m1/1365799-1370039-1432203";

// Acesso estático (e não por chave dinâmica) para que o Vite substitua o valor
// em tempo de build: é o que permite eliminar o mock do bundle de produção.
export const mockApiEnabled = import.meta.env.VITE_ENABLE_MOCK_API === "true";

// Azure Function publicada à parte da API da carteira: devolve texto puro, sem
// autenticação, e por isso não passa pelo cliente `request`.
export const statusFunctionUrl =
	"https://function-teste-2026-d6fgbcdub7ffhhe9.brazilsouth-01.azurewebsites.net/api/getstatus";

// CRUD de usuários publicado à parte em Azure Functions (MongoDB Atlas). Tem
// contrato e envelope de erro próprios, então não passa pelo cliente `request`.
export const usersFunctionBaseUrl =
	"https://create-user-31082026-gwdyazh9aec0cyaa.brazilsouth-01.azurewebsites.net/api";

export const usersFunctionRegion = "Brazil South";
