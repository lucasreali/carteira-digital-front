import { Link } from "@tanstack/react-router";

import type { Transaction } from "@/api/schemas/transaction";
import { AmountText } from "@/components/common/amount-text";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDateTime } from "@/lib/format";
import { transactionStatusLabels, transactionTypeLabels } from "@/lib/labels";
import { TransactionIcon } from "./transaction-icon";

export function directionFor(
	transaction: Transaction,
	walletIds: ReadonlyArray<string>,
) {
	const owned = new Set(walletIds);
	if (
		transaction.destination_wallet_id &&
		owned.has(transaction.destination_wallet_id)
	) {
		return "credit" as const;
	}
	return "debit" as const;
}

export function counterpartyOf(transaction: Transaction) {
	const name = transaction.metadata.counterparty_name;
	return typeof name === "string" ? name : null;
}

type TransactionRowProps = {
	transaction: Transaction;
	walletIds: ReadonlyArray<string>;
};

export function TransactionRow({
	transaction,
	walletIds,
}: TransactionRowProps) {
	const direction = directionFor(transaction, walletIds);
	const counterparty = counterpartyOf(transaction);

	return (
		<Link
			to="/transacoes/$transactionId"
			params={{ transactionId: transaction.id }}
			className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
		>
			<TransactionIcon type={transaction.type} direction={direction} />

			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-sm">
					{transaction.description || transactionTypeLabels[transaction.type]}
				</p>
				<p className="truncate text-muted-foreground text-xs">
					{transactionTypeLabels[transaction.type]}
					{counterparty ? ` · ${counterparty}` : ""} ·{" "}
					{formatDateTime(transaction.created_at)}
				</p>
			</div>

			<div className="flex shrink-0 flex-col items-end gap-1">
				<AmountText
					cents={transaction.amount}
					currency={transaction.currency}
					direction={direction}
				/>
				{transaction.status === "completed" ? null : (
					<StatusBadge
						status={transaction.status}
						label={transactionStatusLabels[transaction.status]}
					/>
				)}
			</div>
		</Link>
	);
}
