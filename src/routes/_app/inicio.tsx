import {
	IconArrowsExchange,
	IconBuildingBank,
	IconCreditCard,
	IconEye,
	IconEyeOff,
	IconPlus,
	IconQrcode,
} from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { useTransactions } from "@/api/queries/transactions";
import { useWallets } from "@/api/queries/wallets";
import type { Wallet } from "@/api/schemas/wallet";
import { useCurrentUser } from "@/auth/use-session";
import {
	EmptyState,
	ErrorState,
	LoadingRows,
} from "@/components/common/data-state";
import { TransactionRow } from "@/components/transactions/transaction-row";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Money } from "@/domain/money";

export const Route = createFileRoute("/_app/inicio")({
	component: DashboardScreen,
});

const quickActions = [
	{ to: "/transferir", label: "Transferir", icon: IconArrowsExchange },
	{ to: "/pix/pagar", label: "Pagar Pix", icon: IconQrcode },
	{ to: "/depositar", label: "Depositar", icon: IconBuildingBank },
	{ to: "/sacar", label: "Sacar", icon: IconCreditCard },
];

function totalOf(wallets: ReadonlyArray<Wallet>) {
	return wallets.reduce(
		(total, wallet) => total.plus(Money.fromCents(wallet.total_balance)),
		Money.zero(),
	);
}

function availableOf(wallets: ReadonlyArray<Wallet>) {
	return wallets.reduce(
		(total, wallet) => total.plus(Money.fromCents(wallet.available_balance)),
		Money.zero(),
	);
}

function blockedOf(wallets: ReadonlyArray<Wallet>) {
	return wallets.reduce(
		(total, wallet) => total.plus(Money.fromCents(wallet.blocked_balance)),
		Money.zero(),
	);
}

function DashboardScreen() {
	const user = useCurrentUser();
	const wallets = useWallets();
	const transactions = useTransactions({ limit: 6 });
	const [hidden, setHidden] = useState(false);

	const items = wallets.data?.data ?? [];
	const firstName = user?.full_name.split(" ")[0] ?? "";

	function reveal(money: Money) {
		return hidden ? "•••••••" : money.toString();
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="text-muted-foreground text-sm">Olá, {firstName}</p>
					<h1 className="font-heading font-semibold text-2xl tracking-tight">
						Sua carteira hoje
					</h1>
				</div>
				<Button
					variant="outline"
					size="sm"
					render={<Link to="/carteiras/nova" />}
				>
					<IconPlus />
					Nova carteira
				</Button>
			</div>

			{user?.kyc_status !== "approved" ? (
				<Alert>
					<AlertTitle>Verificação de identidade pendente</AlertTitle>
					<AlertDescription>
						Conclua o KYC para liberar limites maiores e a criação de novas
						carteiras.
					</AlertDescription>
					<AlertAction>
						<Button
							size="sm"
							variant="outline"
							render={<Link to="/perfil/kyc" />}
						>
							Verificar agora
						</Button>
					</AlertAction>
				</Alert>
			) : null}

			<Card className="relative overflow-hidden">
				<div
					aria-hidden
					className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,var(--primary),transparent_60%)] opacity-[0.16]"
				/>
				<CardContent className="relative space-y-6 py-6">
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs uppercase tracking-widest">
								Saldo disponível
							</p>
							{wallets.isPending ? (
								<Skeleton className="h-10 w-56" />
							) : (
								<p className="numeric font-heading font-semibold text-4xl tabular-nums">
									{reveal(availableOf(items))}
								</p>
							)}
						</div>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={hidden ? "Mostrar valores" : "Ocultar valores"}
							onClick={() => setHidden((current) => !current)}
						>
							{hidden ? <IconEyeOff /> : <IconEye />}
						</Button>
					</div>

					<dl className="grid grid-cols-2 gap-4 border-border/60 border-t pt-4 sm:grid-cols-3">
						<div>
							<dt className="text-muted-foreground text-xs">Saldo total</dt>
							<dd className="numeric font-medium tabular-nums">
								{reveal(totalOf(items))}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs">Bloqueado</dt>
							<dd className="numeric font-medium tabular-nums">
								{reveal(blockedOf(items))}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs">
								Carteiras ativas
							</dt>
							<dd className="numeric font-medium tabular-nums">
								{items.length}
							</dd>
						</div>
					</dl>

					<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
						{quickActions.map((action) => (
							<Button
								key={action.to}
								variant="outline"
								className="h-auto flex-col gap-1.5 py-3"
								render={<Link to={action.to} />}
							>
								<action.icon className="size-4 text-primary" />
								<span className="text-xs">{action.label}</span>
							</Button>
						))}
					</div>
				</CardContent>
			</Card>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="font-heading font-semibold text-lg">Carteiras</h2>
					<Button variant="ghost" size="sm" render={<Link to="/carteiras" />}>
						Ver todas
					</Button>
				</div>

				{wallets.isPending ? (
					<LoadingRows rows={2} />
				) : wallets.isError ? (
					<ErrorState error={wallets.error} onRetry={() => wallets.refetch()} />
				) : items.length === 0 ? (
					<EmptyState
						title="Nenhuma carteira ainda"
						description="Crie uma carteira para começar a movimentar."
						action={
							<Button size="sm" render={<Link to="/carteiras/nova" />}>
								Criar carteira
							</Button>
						}
					/>
				) : (
					<div className="grid gap-3 sm:grid-cols-2">
						{items.map((wallet) => (
							<Link
								key={wallet.id}
								to="/carteiras/$walletId"
								params={{ walletId: wallet.id }}
								className="group block border border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
							>
								<div className="flex items-center justify-between gap-2">
									<p className="font-medium text-sm">{wallet.alias}</p>
									{wallet.is_default ? (
										<span className="bg-primary/10 px-1.5 py-0.5 text-[0.65rem] text-primary uppercase tracking-wide">
											Padrão
										</span>
									) : null}
								</div>
								<p className="numeric mt-2 font-heading font-semibold text-xl tabular-nums">
									{reveal(
										Money.fromCents(wallet.available_balance, wallet.currency),
									)}
								</p>
								<p className="mt-1 text-muted-foreground text-xs">
									{wallet.currency} · bloqueado{" "}
									{Money.fromCents(
										wallet.blocked_balance,
										wallet.currency,
									).toString()}
								</p>
							</Link>
						))}
					</div>
				)}
			</section>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="font-heading font-semibold text-lg">
						Últimas movimentações
					</h2>
					<Button variant="ghost" size="sm" render={<Link to="/transacoes" />}>
						Ver extrato
					</Button>
				</div>

				{transactions.isPending ? (
					<LoadingRows />
				) : transactions.isError ? (
					<ErrorState
						error={transactions.error}
						onRetry={() => transactions.refetch()}
					/>
				) : transactions.data.data.length === 0 ? (
					<EmptyState
						title="Nenhuma movimentação"
						description="Assim que houver entradas ou saídas elas aparecem aqui."
					/>
				) : (
					<Card>
						<CardContent className="divide-y divide-border/60 p-0">
							{transactions.data.data.map((transaction) => (
								<TransactionRow
									key={transaction.id}
									transaction={transaction}
									walletIds={items.map((wallet) => wallet.id)}
								/>
							))}
						</CardContent>
					</Card>
				)}
			</section>
		</div>
	);
}
