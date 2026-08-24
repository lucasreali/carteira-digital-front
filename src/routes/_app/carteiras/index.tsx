import { IconPlus, IconWallet } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useWallets } from "@/api/queries/wallets";
import {
	EmptyState,
	ErrorState,
	LoadingRows,
} from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Money } from "@/domain/money";
import { formatDate } from "@/lib/format";
import { walletStatusLabels } from "@/lib/labels";

export const Route = createFileRoute("/_app/carteiras/")({
	component: WalletsScreen,
});

function WalletsScreen() {
	const wallets = useWallets();
	const items = wallets.data?.data ?? [];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Carteiras"
				description="Cada carteira tem saldo, moeda e chaves Pix próprias."
				actions={
					<Button size="sm" render={<Link to="/carteiras/nova" />}>
						<IconPlus />
						Nova carteira
					</Button>
				}
			/>

			{wallets.isPending ? (
				<LoadingRows rows={3} />
			) : wallets.isError ? (
				<ErrorState error={wallets.error} onRetry={() => wallets.refetch()} />
			) : items.length === 0 ? (
				<EmptyState
					icon={<IconWallet />}
					title="Nenhuma carteira"
					description="Crie sua primeira carteira para começar a movimentar."
					action={
						<Button size="sm" render={<Link to="/carteiras/nova" />}>
							Criar carteira
						</Button>
					}
				/>
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{items.map((wallet) => (
						<Link
							key={wallet.id}
							to="/carteiras/$walletId"
							params={{ walletId: wallet.id }}
							className="group flex flex-col gap-4 border border-border/60 bg-card p-5 transition-colors hover:border-primary/40"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="space-y-1">
									<p className="font-heading font-medium text-base">
										{wallet.alias}
									</p>
									<p className="text-muted-foreground text-xs">
										{wallet.currency} · desde {formatDate(wallet.created_at)}
									</p>
								</div>
								<div className="flex flex-col items-end gap-1.5">
									<StatusBadge
										status={wallet.status}
										label={walletStatusLabels[wallet.status]}
									/>
									{wallet.is_default ? (
										<span className="text-[0.65rem] text-primary uppercase tracking-wide">
											Padrão
										</span>
									) : null}
								</div>
							</div>

							<div>
								<p className="text-muted-foreground text-xs">Disponível</p>
								<p className="numeric font-heading font-semibold text-2xl tabular-nums">
									{Money.fromCents(
										wallet.available_balance,
										wallet.currency,
									).toString()}
								</p>
							</div>

							<dl className="grid grid-cols-2 gap-3 border-border/60 border-t pt-3 text-xs">
								<div>
									<dt className="text-muted-foreground">Bloqueado</dt>
									<dd className="numeric tabular-nums">
										{Money.fromCents(
											wallet.blocked_balance,
											wallet.currency,
										).toString()}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">Total</dt>
									<dd className="numeric tabular-nums">
										{Money.fromCents(
											wallet.total_balance,
											wallet.currency,
										).toString()}
									</dd>
								</div>
							</dl>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
