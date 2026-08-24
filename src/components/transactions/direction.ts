import type { Transaction } from "@/api/schemas/transaction";

export type MovementDirection = "credit" | "debit" | "internal";

export function directionFor(
	transaction: Transaction,
	walletIds: ReadonlyArray<string>,
): MovementDirection {
	const owned = new Set(walletIds);
	const sourceIsOwned = Boolean(
		transaction.source_wallet_id && owned.has(transaction.source_wallet_id),
	);
	const destinationIsOwned = Boolean(
		transaction.destination_wallet_id &&
			owned.has(transaction.destination_wallet_id),
	);

	if (sourceIsOwned && destinationIsOwned) return "internal";
	return destinationIsOwned ? "credit" : "debit";
}

export function counterpartyOf(transaction: Transaction) {
	const name = transaction.metadata.counterparty_name;
	return typeof name === "string" ? name : null;
}
