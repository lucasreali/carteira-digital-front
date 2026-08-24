const STORAGE_KEY = "carteira-digital:mock-db";
const SEED_VERSION = 1;

export type MockUser = {
	id: string;
	full_name: string;
	email: string;
	document: string;
	phone: string;
	password: string;
	birth_date: string;
	status: "active" | "blocked" | "closing" | "closed";
	kyc_status: "pending" | "in_review" | "approved" | "rejected";
	created_at: string;
	updated_at: string;
	version: number;
};

export type MockKyc = {
	user_id: string;
	status: MockUser["kyc_status"];
	level: number;
	submitted_at: string | null;
	reviewed_at: string | null;
	rejection_reason: string | null;
	limits: { daily_transfer_limit: number; nightly_transfer_limit: number };
};

export type MockWallet = {
	id: string;
	user_id: string;
	alias: string;
	currency: string;
	available_balance: number;
	blocked_balance: number;
	is_default: boolean;
	status: "active" | "frozen" | "closed";
	created_at: string;
	updated_at: string;
	version: number;
};

export type MockTransaction = {
	id: string;
	user_id: string;
	type: "deposit" | "withdrawal" | "transfer" | "pix_in" | "pix_out" | "reversal" | "fee";
	status: "pending" | "processing" | "completed" | "failed" | "reversed" | "canceled";
	amount: number;
	fee: number;
	net_amount: number;
	currency: string;
	source_wallet_id: string | null;
	destination_wallet_id: string | null;
	description: string | null;
	metadata: Record<string, unknown>;
	idempotency_key: string | null;
	created_at: string;
	completed_at: string | null;
};

export type MockEntry = {
	id: string;
	wallet_id: string;
	transaction_id: string;
	type: string;
	direction: "credit" | "debit";
	amount: number;
	balance_after: number;
	description: string;
	created_at: string;
};

export type MockPaymentMethod = {
	id: string;
	user_id: string;
	type: "card" | "bank_account";
	is_default: boolean;
	status: "pending_verification" | "verified" | "rejected" | "expired";
	bank_account: {
		bank_code: string;
		bank_name: string;
		agency: string;
		account_masked: string;
		account_type: "checking" | "savings";
		holder_document_masked: string;
	} | null;
	card: {
		brand: string;
		last4: string;
		exp_month: number;
		exp_year: number;
		holder_name: string;
	} | null;
	created_at: string;
};

export type MockPixKey = {
	id: string;
	user_id: string;
	type: "cpf" | "cnpj" | "email" | "phone" | "random";
	value: string;
	wallet_id: string;
	status: "active" | "pending_portability" | "inactive";
	created_at: string;
};

export type MockPixCharge = {
	id: string;
	user_id: string;
	wallet_id: string;
	amount: number;
	status: "active" | "paid" | "expired" | "canceled";
	qr_code: string;
	qr_code_image_url: string;
	description: string | null;
	expires_at: string;
	paid_at: string | null;
	transaction_id: string | null;
	created_at: string;
};

export type MockBeneficiary = {
	id: string;
	user_id: string;
	nickname: string;
	full_name: string;
	document_masked: string;
	pix_key: string | null;
	bank_code: string | null;
	is_favorite: boolean;
	created_at: string;
};

export type MockWebhook = {
	id: string;
	user_id: string;
	url: string;
	events: Array<string>;
	status: "active" | "disabled";
	secret: string;
	created_at: string;
};

export type MockState = {
	users: Array<MockUser>;
	kyc: Array<MockKyc>;
	wallets: Array<MockWallet>;
	transactions: Array<MockTransaction>;
	entries: Array<MockEntry>;
	paymentMethods: Array<MockPaymentMethod>;
	pixKeys: Array<MockPixKey>;
	pixCharges: Array<MockPixCharge>;
	beneficiaries: Array<MockBeneficiary>;
	webhooks: Array<MockWebhook>;
	refreshTokens: Record<string, string>;
	idempotency: Record<string, { body: string; response: string; status: number }>;
};

export function newId() {
	return typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function nowIso() {
	return new Date().toISOString();
}

function daysAgoIso(days: number) {
	const date = new Date();
	date.setDate(date.getDate() - days);
	return date.toISOString();
}

const anaId = "9d3b1f2e-7c44-4a1e-9b62-0f8a2d6c1e55";
const brunoId = "5c1a0d7e-4b22-4f19-8a41-2c9d7e6b3a08";
const anaMainWallet = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const anaTravelWallet = "7f8e9d0c-1b2a-4c3d-9e8f-7a6b5c4d3e2f";
const brunoWallet = "bb11cc22-dd33-4ee4-9ff5-001122334455";

function seed(): MockState {
	const users: Array<MockUser> = [
		{
			id: anaId,
			full_name: "Ana Souza",
			email: "ana.souza@example.com",
			document: "39053344705",
			phone: "+5541999998888",
			password: "S3nh@ForteAqui",
			birth_date: "1993-04-17",
			status: "active",
			kyc_status: "approved",
			created_at: daysAgoIso(120),
			updated_at: daysAgoIso(30),
			version: 3,
		},
		{
			id: brunoId,
			full_name: "Bruno Lima",
			email: "bruno.lima@example.com",
			document: "12345678909",
			phone: "+5541988887777",
			password: "S3nh@ForteAqui",
			birth_date: "1990-11-02",
			status: "active",
			kyc_status: "approved",
			created_at: daysAgoIso(200),
			updated_at: daysAgoIso(60),
			version: 1,
		},
	];

	const wallets: Array<MockWallet> = [
		{
			id: anaMainWallet,
			user_id: anaId,
			alias: "Conta principal",
			currency: "BRL",
			available_balance: 152340,
			blocked_balance: 5000,
			is_default: true,
			status: "active",
			created_at: daysAgoIso(120),
			updated_at: daysAgoIso(1),
			version: 12,
		},
		{
			id: anaTravelWallet,
			user_id: anaId,
			alias: "Reserva viagem",
			currency: "BRL",
			available_balance: 480000,
			blocked_balance: 0,
			is_default: false,
			status: "active",
			created_at: daysAgoIso(45),
			updated_at: daysAgoIso(45),
			version: 1,
		},
		{
			id: brunoWallet,
			user_id: brunoId,
			alias: "Conta principal",
			currency: "BRL",
			available_balance: 320000,
			blocked_balance: 0,
			is_default: true,
			status: "active",
			created_at: daysAgoIso(200),
			updated_at: daysAgoIso(2),
			version: 4,
		},
	];

	const transferId = newId();
	const withdrawalId = newId();
	const pixInId = newId();

	const transactions: Array<MockTransaction> = [
		{
			id: transferId,
			user_id: anaId,
			type: "transfer",
			status: "completed",
			amount: 75000,
			fee: 0,
			net_amount: 75000,
			currency: "BRL",
			source_wallet_id: brunoWallet,
			destination_wallet_id: anaMainWallet,
			description: "Aluguel agosto",
			metadata: { counterparty_name: "Bruno Lima", counterparty_document_masked: "***.456.789-**" },
			idempotency_key: "trf_seed_001",
			created_at: daysAgoIso(1),
			completed_at: daysAgoIso(1),
		},
		{
			id: withdrawalId,
			user_id: anaId,
			type: "withdrawal",
			status: "completed",
			amount: 22660,
			fee: 350,
			net_amount: 22310,
			currency: "BRL",
			source_wallet_id: anaMainWallet,
			destination_wallet_id: null,
			description: "Saque para conta Itaú",
			metadata: { bank_code: "341", agency: "0001", account_masked: "****5-6" },
			idempotency_key: "wd_seed_001",
			created_at: daysAgoIso(2),
			completed_at: daysAgoIso(2),
		},
		{
			id: pixInId,
			user_id: anaId,
			type: "pix_in",
			status: "completed",
			amount: 32000,
			fee: 0,
			net_amount: 32000,
			currency: "BRL",
			source_wallet_id: null,
			destination_wallet_id: anaMainWallet,
			description: "Pedido #1042",
			metadata: { counterparty_name: "Bruno Lima", counterparty_bank: "Nubank" },
			idempotency_key: null,
			created_at: daysAgoIso(4),
			completed_at: daysAgoIso(4),
		},
	];

	const entries: Array<MockEntry> = [
		{
			id: newId(),
			wallet_id: anaMainWallet,
			transaction_id: transferId,
			type: "transfer_in",
			direction: "credit",
			amount: 75000,
			balance_after: 152340,
			description: "Transferência recebida de Bruno Lima",
			created_at: daysAgoIso(1),
		},
		{
			id: newId(),
			wallet_id: anaMainWallet,
			transaction_id: withdrawalId,
			type: "withdrawal",
			direction: "debit",
			amount: 22660,
			balance_after: 77340,
			description: "Saque para Banco 341 ag 0001 cc ****5-6",
			created_at: daysAgoIso(2),
		},
		{
			id: newId(),
			wallet_id: anaMainWallet,
			transaction_id: pixInId,
			type: "pix_in",
			direction: "credit",
			amount: 32000,
			balance_after: 100000,
			description: "Pix recebido de Bruno Lima",
			created_at: daysAgoIso(4),
		},
	];

	return {
		users,
		kyc: [
			{
				user_id: anaId,
				status: "approved",
				level: 2,
				submitted_at: daysAgoIso(119),
				reviewed_at: daysAgoIso(119),
				rejection_reason: null,
				limits: { daily_transfer_limit: 1000000, nightly_transfer_limit: 100000 },
			},
			{
				user_id: brunoId,
				status: "approved",
				level: 2,
				submitted_at: daysAgoIso(199),
				reviewed_at: daysAgoIso(199),
				rejection_reason: null,
				limits: { daily_transfer_limit: 1000000, nightly_transfer_limit: 100000 },
			},
		],
		wallets,
		transactions,
		entries,
		paymentMethods: [
			{
				id: "pm_4c3d2e1f-9a8b-4c7d-6e5f-4a3b2c1d0e9f",
				user_id: anaId,
				type: "bank_account",
				is_default: true,
				status: "verified",
				bank_account: {
					bank_code: "341",
					bank_name: "Itaú Unibanco",
					agency: "0001",
					account_masked: "****5-6",
					account_type: "checking",
					holder_document_masked: "390.***.***-05",
				},
				card: null,
				created_at: daysAgoIso(100),
			},
			{
				id: "pm_1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
				user_id: anaId,
				type: "card",
				is_default: false,
				status: "verified",
				bank_account: null,
				card: {
					brand: "visa",
					last4: "4242",
					exp_month: 12,
					exp_year: 2029,
					holder_name: "ANA SOUZA",
				},
				created_at: daysAgoIso(90),
			},
		],
		pixKeys: [
			{
				id: "pk_11223344-5566-4778-8990-aabbccddeeff",
				user_id: anaId,
				type: "email",
				value: "ana.souza@example.com",
				wallet_id: anaMainWallet,
				status: "active",
				created_at: daysAgoIso(110),
			},
			{
				id: "pk_99887766-5544-4332-8110-ffeeddccbbaa",
				user_id: anaId,
				type: "random",
				value: "7a1c3e5f-9b2d-4e6a-8c0f-1d3b5a7c9e2f",
				wallet_id: anaMainWallet,
				status: "active",
				created_at: daysAgoIso(110),
			},
			{
				id: "pk_aabbccdd-1122-4334-8556-778899aabbcc",
				user_id: brunoId,
				type: "email",
				value: "bruno.lima@example.com",
				wallet_id: brunoWallet,
				status: "active",
				created_at: daysAgoIso(190),
			},
		],
		pixCharges: [],
		beneficiaries: [
			{
				id: "ben_a1b2c3d4-e5f6-4718-9a0b-1c2d3e4f5a6b",
				user_id: anaId,
				nickname: "Bruno (aluguel)",
				full_name: "Bruno Lima",
				document_masked: "***.456.789-**",
				pix_key: "bruno.lima@example.com",
				bank_code: "260",
				is_favorite: true,
				created_at: daysAgoIso(20),
			},
		],
		webhooks: [
			{
				id: "wh_0f1e2d3c-4b5a-4697-8887-776655443322",
				user_id: anaId,
				url: "https://meuapp.example.com/hooks/wallet",
				events: ["transaction.completed", "transaction.failed", "deposit.confirmed"],
				status: "active",
				secret: "whsec_3a7f9b2c1d4e6f8a0b2c4d6e8f0a2b4c9f2c",
				created_at: daysAgoIso(15),
			},
		],
		refreshTokens: {},
		idempotency: {},
	};
}

let state: MockState | null = null;

function persist() {
	if (typeof window === "undefined" || !state) return;
	window.localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify({ version: SEED_VERSION, state }),
	);
}

export function db() {
	if (state) return state;
	if (typeof window !== "undefined") {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw) {
			try {
				const parsed = JSON.parse(raw) as { version: number; state: MockState };
				if (parsed.version === SEED_VERSION) {
					state = parsed.state;
					return state;
				}
			} catch {
				window.localStorage.removeItem(STORAGE_KEY);
			}
		}
	}
	state = seed();
	persist();
	return state;
}

export function commit() {
	persist();
}

export function resetDb() {
	state = seed();
	persist();
}
