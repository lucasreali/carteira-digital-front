import { createFileRoute } from "@tanstack/react-router";

import { useWallets } from "@/api/queries/wallets";
import { ErrorState, LoadingRows } from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/domain/money";

export const Route = createFileRoute("/_app/inicio")({
	component: DashboardScreen,
});

function DashboardScreen() {
	const wallets = useWallets();
	const items = wallets.data?.data ?? [];
	const available = items.reduce(
		(total, wallet) => total.plus(Money.fromCents(wallet.available_balance)),
		Money.zero(),
	);

	return (
		<div className="space-y-6">
			<PageHeader title="Início" description="Resumo das suas carteiras." />

			{wallets.isPending ? (
				<LoadingRows rows={2} />
			) : wallets.isError ? (
				<ErrorState error={wallets.error} onRetry={() => wallets.refetch()} />
			) : (
				<Card>
					<CardContent className="space-y-1 py-6">
						<p className="text-muted-foreground text-xs uppercase tracking-widest">
							Saldo disponível
						</p>
						<p className="numeric font-heading font-semibold text-4xl tabular-nums">
							{available.toString()}
						</p>
						<p className="text-muted-foreground text-sm">
							{items.length} carteira(s) ativa(s)
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
