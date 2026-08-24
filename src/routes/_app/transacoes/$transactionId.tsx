import { IconArrowLeft } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";

import { useTransaction } from "@/api/queries/transactions";
import { useWallets } from "@/api/queries/wallets";
import { CopyButton } from "@/components/common/copy-button";
import { ErrorState, LoadingRows } from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { ReversalDialog } from "@/components/transactions/reversal-dialog";
import { TransactionIcon } from "@/components/transactions/transaction-icon";
import { directionFor } from "@/components/transactions/transaction-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/domain/money";
import { formatDateTime } from "@/lib/format";
import { transactionStatusLabels, transactionTypeLabels } from "@/lib/labels";

export const Route = createFileRoute("/_app/transacoes/$transactionId")({
	component: TransactionScreen,
});

const REVERSIBLE_TYPES = ["transfer", "pix_out", "pix_in", "deposit"];

const metadataLabels: Record<string, string> = {
	counterparty_name: "Contraparte",
	counterparty_document_masked: "Documento da contraparte",
	counterparty_bank: "Banco da contraparte",
	pix_key: "Chave Pix",
	end_to_end_id: "End-to-end ID",
	method: "Método",
	bank_code: "Banco",
	agency: "Agência",
	account_masked: "Conta",
	estimated_settlement: "Liquidação estimada",
	expires_at: "Expira em",
	original_transaction_id: "Transação original",
	reason: "Motivo",
	charge_id: "Cobrança",
	scheduled_for: "Agendada para",
	payment_method_id: "Método de pagamento",
};

function formatMetadataValue(key: string, value: unknown) {
	if (value === null || value === undefined || value === "") return "—";
	if (
		key.endsWith("_at") ||
		key === "estimated_settlement" ||
		key === "scheduled_for"
	) {
		return formatDateTime(String(value));
	}
	return String(value);
}

function TransactionScreen() {
	const { transactionId } = Route.useParams();
	const transaction = useTransaction(transactionId);
	const wallets = useWallets();

	if (transaction.isPending) return <LoadingRows rows={4} />;
	if (transaction.isError) {
		return (
			<ErrorState
				error={transaction.error}
				onRetry={() => transaction.refetch()}
			/>
		);
	}

	const data = transaction.data;
	const walletIds = (wallets.data?.data ?? []).map((wallet) => wallet.id);
	const direction = directionFor(data, walletIds);
	const qrCode =
		typeof data.metadata.qr_code === "string" ? data.metadata.qr_code : null;
	const canReverse =
		data.status === "completed" && REVERSIBLE_TYPES.includes(data.type);
	const metadataEntries = Object.entries(data.metadata).filter(
		([key]) => key !== "qr_code",
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title={transactionTypeLabels[data.type]}
				description={formatDateTime(data.created_at)}
				actions={
					<>
						<Button
							variant="ghost"
							size="sm"
							render={<Link to="/transacoes" />}
						>
							<IconArrowLeft />
							Transações
						</Button>
						{canReverse ? <ReversalDialog transaction={data} /> : null}
					</>
				}
			/>

			<Card>
				<CardContent className="flex flex-wrap items-center gap-4 py-6">
					<TransactionIcon type={data.type} direction={direction} size="lg" />
					<div className="flex-1 space-y-1">
						<p className="numeric font-heading font-semibold text-3xl tabular-nums">
							{direction === "credit" ? "+" : "−"}
							{Money.fromCents(data.amount, data.currency).toString()}
						</p>
						<p className="text-muted-foreground text-sm">
							{data.description ?? "Sem descrição"}
						</p>
					</div>
					<StatusBadge
						status={data.status}
						label={transactionStatusLabels[data.status]}
					/>
				</CardContent>
			</Card>

			{qrCode ? (
				<Card>
					<CardHeader>
						<CardTitle>Pague com Pix</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
						<div className="bg-white p-3">
							<QRCodeSVG value={qrCode} size={168} level="M" />
						</div>
						<div className="min-w-0 flex-1 space-y-3">
							<p className="text-muted-foreground text-sm">
								Escaneie o QR Code ou use o código copia-e-cola. O crédito é
								confirmado quando o provedor notifica o webhook.
							</p>
							<p className="break-all border border-border/60 bg-muted/40 p-3 font-mono text-xs">
								{qrCode}
							</p>
							<CopyButton value={qrCode} label="Copiar código" />
						</div>
					</CardContent>
				</Card>
			) : null}

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Valores</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="space-y-3 text-sm">
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Valor bruto</dt>
								<dd className="numeric tabular-nums">
									{Money.fromCents(data.amount, data.currency).toString()}
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Tarifa</dt>
								<dd className="numeric tabular-nums">
									{Money.fromCents(data.fee, data.currency).toString()}
								</dd>
							</div>
							<div className="flex justify-between border-border/60 border-t pt-3 font-medium">
								<dt>Valor líquido</dt>
								<dd className="numeric tabular-nums">
									{Money.fromCents(data.net_amount, data.currency).toString()}
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Rastreabilidade</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="space-y-3 text-sm">
							<div>
								<dt className="text-muted-foreground text-xs">Identificador</dt>
								<dd className="flex items-center gap-2">
									<span className="min-w-0 flex-1 break-all font-mono text-xs">
										{data.id}
									</span>
									<CopyButton
										value={data.id}
										size="icon-sm"
										label="Copiar identificador"
									/>
								</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">
									Idempotency-Key
								</dt>
								<dd className="break-all font-mono text-xs">
									{data.idempotency_key ?? "—"}
								</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">
									Carteira de origem
								</dt>
								<dd className="break-all font-mono text-xs">
									{data.source_wallet_id ?? "—"}
								</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">
									Carteira de destino
								</dt>
								<dd className="break-all font-mono text-xs">
									{data.destination_wallet_id ?? "—"}
								</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs">Concluída em</dt>
								<dd>{formatDateTime(data.completed_at)}</dd>
							</div>
						</dl>
					</CardContent>
				</Card>
			</div>

			{metadataEntries.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>Detalhes da operação</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid gap-4 text-sm sm:grid-cols-2">
							{metadataEntries.map(([key, value]) => (
								<div key={key}>
									<dt className="text-muted-foreground text-xs">
										{metadataLabels[key] ?? key}
									</dt>
									<dd className="break-all">
										{formatMetadataValue(key, value)}
									</dd>
								</div>
							))}
						</dl>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
