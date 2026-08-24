export const transactionTypeLabels = {
	deposit: "Depósito",
	withdrawal: "Saque",
	transfer: "Transferência",
	pix_in: "Pix recebido",
	pix_out: "Pix enviado",
	reversal: "Estorno",
	fee: "Tarifa",
} as const;

export const transactionStatusLabels = {
	pending: "Pendente",
	processing: "Processando",
	completed: "Concluída",
	failed: "Falhou",
	reversed: "Estornada",
	canceled: "Cancelada",
} as const;

export const walletStatusLabels = {
	active: "Ativa",
	frozen: "Congelada",
	closed: "Encerrada",
} as const;

export const userStatusLabels = {
	active: "Ativa",
	blocked: "Bloqueada",
	closing: "Em encerramento",
	closed: "Encerrada",
} as const;

export const kycStatusLabels = {
	pending: "Pendente",
	in_review: "Em análise",
	approved: "Aprovado",
	rejected: "Reprovado",
} as const;

export const paymentMethodStatusLabels = {
	pending_verification: "Aguardando verificação",
	verified: "Verificado",
	rejected: "Recusado",
	expired: "Expirado",
} as const;

export const paymentMethodTypeLabels = {
	card: "Cartão",
	bank_account: "Conta bancária",
} as const;

export const accountTypeLabels = {
	checking: "Corrente",
	savings: "Poupança",
} as const;

export const pixKeyTypeLabels = {
	cpf: "CPF",
	cnpj: "CNPJ",
	email: "E-mail",
	phone: "Telefone",
	random: "Aleatória",
} as const;

export const pixKeyStatusLabels = {
	active: "Ativa",
	pending_portability: "Em portabilidade",
	inactive: "Inativa",
} as const;

export const pixChargeStatusLabels = {
	active: "Aguardando pagamento",
	paid: "Paga",
	expired: "Expirada",
	canceled: "Cancelada",
} as const;

export const depositMethodLabels = {
	pix: "Pix",
	card: "Cartão",
	boleto: "Boleto",
} as const;

export const reversalReasonLabels = {
	fraud: "Fraude",
	duplicate: "Duplicidade",
	customer_request: "Solicitação do cliente",
	operational_error: "Erro operacional",
} as const;

export const kycDocumentTypeLabels = {
	cnh: "CNH",
	rg: "RG",
	passport: "Passaporte",
} as const;

export const webhookEventLabels = {
	"transaction.created": "Transação criada",
	"transaction.completed": "Transação concluída",
	"transaction.failed": "Transação falhou",
	"transaction.reversed": "Transação estornada",
	"deposit.confirmed": "Depósito confirmado",
	"withdrawal.settled": "Saque liquidado",
	"pix.charge.paid": "Cobrança Pix paga",
	"kyc.updated": "KYC atualizado",
} as const;

export const currencyLabels = {
	BRL: "Real (BRL)",
	USD: "Dólar (USD)",
	EUR: "Euro (EUR)",
} as const;

export function optionsFrom<T extends Record<string, string>>(labels: T) {
	return Object.entries(labels).map(([value, label]) => ({
		value: value as keyof T & string,
		label,
	}));
}
