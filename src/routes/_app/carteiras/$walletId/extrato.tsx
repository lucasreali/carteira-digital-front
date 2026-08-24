import { IconArrowLeft, IconFileText } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { useStatement, useWallet } from "@/api/queries/wallets";
import { AmountText } from "@/components/common/amount-text";
import {
	EmptyState,
	ErrorState,
	LoadingRows,
} from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Money } from "@/domain/money";
import { daysAgo, formatDateTime, toDateInputValue } from "@/lib/format";

export const Route = createFileRoute("/_app/carteiras/$walletId/extrato")({
	component: StatementScreen,
});

function StatementScreen() {
	const { walletId } = Route.useParams();
	const wallet = useWallet(walletId);
	const [from, setFrom] = useState(toDateInputValue(daysAgo(30)));
	const [to, setTo] = useState(toDateInputValue(new Date()));
	const [cursor, setCursor] = useState<string | undefined>();

	const statement = useStatement(walletId, { from, to, cursor, limit: 20 });
	const currency = wallet.data?.currency ?? "BRL";

	function applyRange(nextFrom: string, nextTo: string) {
		setFrom(nextFrom);
		setTo(nextTo);
		setCursor(undefined);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Extrato"
				description={
					wallet.data
						? `Carteira ${wallet.data.alias}`
						: "Lançamentos da carteira"
				}
				actions={
					<Button
						variant="ghost"
						size="sm"
						render={<Link to="/carteiras/$walletId" params={{ walletId }} />}
					>
						<IconArrowLeft />
						Voltar
					</Button>
				}
			/>

			<Card>
				<CardContent className="flex flex-wrap items-end gap-4 pt-6">
					<Field className="w-40">
						<FieldLabel htmlFor="from">De</FieldLabel>
						<Input
							id="from"
							type="date"
							value={from}
							className="h-9 text-sm"
							onChange={(event) => applyRange(event.target.value, to)}
						/>
					</Field>
					<Field className="w-40">
						<FieldLabel htmlFor="to">Até</FieldLabel>
						<Input
							id="to"
							type="date"
							value={to}
							className="h-9 text-sm"
							onChange={(event) => applyRange(from, event.target.value)}
						/>
					</Field>
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							applyRange(
								toDateInputValue(daysAgo(90)),
								toDateInputValue(new Date()),
							)
						}
					>
						Últimos 90 dias
					</Button>
				</CardContent>
			</Card>

			{statement.isPending ? (
				<LoadingRows rows={5} />
			) : statement.isError ? (
				<ErrorState
					error={statement.error}
					onRetry={() => statement.refetch()}
				/>
			) : (
				<>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="border border-border/60 p-4">
							<p className="text-muted-foreground text-xs">Saldo inicial</p>
							<p className="numeric font-heading font-semibold text-lg tabular-nums">
								{Money.fromCents(
									statement.data.opening_balance,
									currency,
								).toString()}
							</p>
						</div>
						<div className="border border-border/60 p-4">
							<p className="text-muted-foreground text-xs">Saldo final</p>
							<p className="numeric font-heading font-semibold text-lg tabular-nums">
								{Money.fromCents(
									statement.data.closing_balance,
									currency,
								).toString()}
							</p>
						</div>
					</div>

					{statement.data.data.length === 0 ? (
						<EmptyState
							icon={<IconFileText />}
							title="Sem lançamentos no período"
							description="Ajuste o intervalo de datas para ver outras movimentações."
						/>
					) : (
						<Card className="overflow-hidden">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Data</TableHead>
											<TableHead>Descrição</TableHead>
											<TableHead className="text-right">Valor</TableHead>
											<TableHead className="text-right">Saldo após</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{statement.data.data.map((entry) => (
											<TableRow key={entry.id}>
												<TableCell className="whitespace-nowrap text-muted-foreground text-xs">
													{formatDateTime(entry.created_at)}
												</TableCell>
												<TableCell>
													<Link
														to="/transacoes/$transactionId"
														params={{ transactionId: entry.transaction_id }}
														className="hover:text-primary hover:underline"
													>
														{entry.description}
													</Link>
												</TableCell>
												<TableCell className="text-right">
													<AmountText
														cents={entry.amount}
														currency={currency}
														direction={entry.direction}
													/>
												</TableCell>
												<TableCell className="numeric text-right tabular-nums">
													{Money.fromCents(
														entry.balance_after,
														currency,
													).toString()}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</Card>
					)}

					{statement.data.pagination.has_more ? (
						<div className="flex justify-center">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCursor(statement.data.pagination.next_cursor ?? undefined)
								}
							>
								Carregar mais
							</Button>
						</div>
					) : null}
				</>
			)}
		</div>
	);
}
