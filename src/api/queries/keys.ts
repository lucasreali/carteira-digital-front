export const queryKeys = {
	me: ["me"] as const,
	kyc: ["me", "kyc"] as const,
	wallets: (filters: Record<string, unknown> = {}) =>
		["wallets", "list", filters] as const,
	wallet: (walletId: string) => ["wallets", "detail", walletId] as const,
	balance: (walletId: string) => ["wallets", "balance", walletId] as const,
	statement: (walletId: string, filters: Record<string, unknown> = {}) =>
		["wallets", "statement", walletId, filters] as const,
	transactions: (filters: Record<string, unknown> = {}) =>
		["transactions", "list", filters] as const,
	transaction: (transactionId: string) =>
		["transactions", "detail", transactionId] as const,
	paymentMethods: (filters: Record<string, unknown> = {}) =>
		["payment-methods", "list", filters] as const,
	pixKeys: ["pix", "keys"] as const,
	pixCharge: (chargeId: string) => ["pix", "charges", chargeId] as const,
	beneficiaries: (search: string) => ["beneficiaries", "list", search] as const,
	webhooks: ["webhooks", "list"] as const,
	serviceStatus: (name: string) => ["service-status", name] as const,
} as const;

export const invalidationRoots = {
	wallets: ["wallets"] as const,
	transactions: ["transactions"] as const,
	paymentMethods: ["payment-methods"] as const,
	pix: ["pix"] as const,
	beneficiaries: ["beneficiaries"] as const,
	webhooks: ["webhooks"] as const,
	me: ["me"] as const,
};
