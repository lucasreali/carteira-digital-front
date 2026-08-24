import { IconFilterOff, IconListDetails } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useTransactions } from "@/api/queries/transactions";
import { useWallets } from "@/api/queries/wallets";
import {
	EmptyState,
	ErrorState,
	LoadingRows,
} from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { SelectInput } from "@/components/form/fields";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	optionsFrom,
	transactionStatusLabels,
	transactionTypeLabels,
} from "@/lib/labels";

export const Route = createFileRoute("/_app/transacoes/")({
	component: TransactionsScreen,
});

const typeOptions = [
	{ value: "", label: "Todos os tipos" },
	...optionsFrom(transactionTypeLabels),
];
const statusOptions = [
	{ value: "", label: "Todos os status" },
	...optionsFrom(transactionStatusLabels),
];

const emptyFilters = { walletId: "", type: "", status: "", from: "", to: "" };

function TransactionsScreen() {
	const [filters, setFilters] = useState(emptyFilters);
	const wallets = useWallets();

	const transactions = useTransactions({
		wallet_id: filters.walletId || undefined,
		type: filters.type || undefined,
		status: filters.status || undefined,
		from: filters.from ? `${filters.from}T00:00:00.000Z` : undefined,
		to: filters.to ? `${filters.to}T23:59:59.999Z` : undefined,
		limit: 50,
	});

	const walletOptions = [
		{ value: "", label: "Todas as carteiras" },
		...(wallets.data?.data ?? []).map((wallet) => ({
			value: wallet.id,
			label: wallet.alias,
		})),
	];
	const walletIds = (wallets.data?.data ?? []).map((wallet) => wallet.id);
	const hasFilters = Object.values(filters).some(Boolean);

	function update(patch: Partial<typeof emptyFilters>) {
		setFilters((current) => ({ ...current, ...patch }));
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Transações"
				description="Todas as movimentações das suas carteiras, da mais recente para a mais antiga."
			/>

			<Card>
				<CardContent className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-5">
					<Field>
						<FieldLabel htmlFor="wallet">Carteira</FieldLabel>
						<SelectInput
							id="wallet"
							value={filters.walletId}
							onChange={(walletId) => update({ walletId })}
							options={walletOptions}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="type">Tipo</FieldLabel>
						<SelectInput
							id="type"
							value={filters.type}
							onChange={(type) => update({ type })}
							options={typeOptions}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="status">Status</FieldLabel>
						<SelectInput
							id="status"
							value={filters.status}
							onChange={(status) => update({ status })}
							options={statusOptions}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="from">De</FieldLabel>
						<Input
							id="from"
							type="date"
							className="h-9 text-sm"
							value={filters.from}
							onChange={(event) => update({ from: event.target.value })}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="to">Até</FieldLabel>
						<Input
							id="to"
							type="date"
							className="h-9 text-sm"
							value={filters.to}
							onChange={(event) => update({ to: event.target.value })}
						/>
					</Field>
				</CardContent>
			</Card>

			{hasFilters ? (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setFilters(emptyFilters)}
				>
					<IconFilterOff />
					Limpar filtros
				</Button>
			) : null}

			{transactions.isPending ? (
				<LoadingRows rows={6} />
			) : transactions.isError ? (
				<ErrorState
					error={transactions.error}
					onRetry={() => transactions.refetch()}
				/>
			) : transactions.data.data.length === 0 ? (
				<EmptyState
					icon={<IconListDetails />}
					title="Nenhuma transação encontrada"
					description="Ajuste os filtros ou faça uma movimentação para vê-la aqui."
				/>
			) : (
				<Card>
					<CardContent className="divide-y divide-border/60 p-0">
						{transactions.data.data.map((transaction) => (
							<TransactionRow
								key={transaction.id}
								transaction={transaction}
								walletIds={walletIds}
							/>
						))}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
