import { IconArrowLeft, IconListDetails } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useBalance, useWallet } from "@/api/queries/wallets";
import { CopyButton } from "@/components/common/copy-button";
import { ErrorState, LoadingRows } from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CloseWalletDialog } from "@/components/wallets/close-wallet-dialog";
import { EditWalletDialog } from "@/components/wallets/edit-wallet-dialog";
import { Money } from "@/domain/money";
import { formatDateTime } from "@/lib/format";
import { walletStatusLabels } from "@/lib/labels";

export const Route = createFileRoute("/_app/carteiras/$walletId/")({
	component: WalletScreen,
});

function BalanceTile({
	label,
	cents,
	currency,
	hint,
}: {
	label: string;
	cents: number;
	currency: string;
	hint?: string;
}) {
	return (
		<div className="space-y-1 border border-border/60 p-4">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="numeric font-heading font-semibold text-xl tabular-nums">
				{Money.fromCents(cents, currency).toString()}
			</p>
			{hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
		</div>
	);
}

function WalletScreen() {
	const { walletId } = Route.useParams();
	const wallet = useWallet(walletId);
	const balance = useBalance(walletId);

	if (wallet.isPending) return <LoadingRows rows={4} />;
	if (wallet.isError)
		return <ErrorState error={wallet.error} onRetry={() => wallet.refetch()} />;

	const currency = wallet.data.currency;

	return (
		<div className="space-y-6">
			<PageHeader
				title={wallet.data.alias}
				description={`${currency} · atualizada em ${formatDateTime(wallet.data.updated_at)}`}
				actions={
					<>
						<Button variant="ghost" size="sm" render={<Link to="/carteiras" />}>
							<IconArrowLeft />
							Carteiras
						</Button>
						<Button
							variant="outline"
							size="sm"
							render={
								<Link to="/carteiras/$walletId/extrato" params={{ walletId }} />
							}
						>
							<IconListDetails />
							Extrato
						</Button>
						<EditWalletDialog wallet={wallet.data} />
						<CloseWalletDialog wallet={wallet.data} />
					</>
				}
			/>

			<div className="flex flex-wrap items-center gap-2">
				<StatusBadge
					status={wallet.data.status}
					label={walletStatusLabels[wallet.data.status]}
				/>
				{wallet.data.is_default ? (
					<span className="bg-primary/10 px-2 py-0.5 text-primary text-xs">
						Carteira padrão
					</span>
				) : null}
				<span className="text-muted-foreground text-xs">
					versão {wallet.data.version}
				</span>
			</div>

			{balance.isPending ? (
				<Skeleton className="h-28 w-full" />
			) : balance.isError ? (
				<ErrorState error={balance.error} onRetry={() => balance.refetch()} />
			) : (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<BalanceTile
						label="Disponível"
						cents={balance.data.available_balance}
						currency={currency}
						hint="Pronto para uso"
					/>
					<BalanceTile
						label="Bloqueado"
						cents={balance.data.blocked_balance}
						currency={currency}
						hint="Saques em curso e retenções"
					/>
					<BalanceTile
						label="Créditos pendentes"
						cents={balance.data.pending_credits}
						currency={currency}
						hint="Aguardando compensação"
					/>
					<BalanceTile
						label="Total"
						cents={balance.data.total_balance}
						currency={currency}
					/>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Dados da carteira</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex flex-wrap items-center justify-between gap-2 border-border/60 border-b pb-3">
						<div>
							<p className="text-muted-foreground text-xs">Identificador</p>
							<p className="numeric break-all font-mono text-sm">
								{wallet.data.id}
							</p>
						</div>
						<CopyButton value={wallet.data.id} label="Copiar ID" />
					</div>
					<dl className="grid gap-4 text-sm sm:grid-cols-3">
						<div>
							<dt className="text-muted-foreground text-xs">Moeda</dt>
							<dd>{currency}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs">Criada em</dt>
							<dd>{formatDateTime(wallet.data.created_at)}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs">Atualizada em</dt>
							<dd>{formatDateTime(wallet.data.updated_at)}</dd>
						</div>
					</dl>
				</CardContent>
			</Card>
		</div>
	);
}
