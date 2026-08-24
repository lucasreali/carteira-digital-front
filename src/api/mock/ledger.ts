import type { MockWallet } from "./db";
import { commit } from "./db";
import { recordEntry, touchWallet } from "./support";

type Movement = {
	wallet: MockWallet;
	amount: number;
	transactionId: string;
	type: string;
	description: string;
};

export function credit({
	wallet,
	amount,
	transactionId,
	type,
	description,
}: Movement) {
	wallet.available_balance += amount;
	touchWallet(wallet);
	recordEntry({
		wallet,
		transactionId,
		type,
		direction: "credit",
		amount,
		description,
	});
	commit();
}

export function debit({
	wallet,
	amount,
	transactionId,
	type,
	description,
}: Movement) {
	wallet.available_balance -= amount;
	touchWallet(wallet);
	recordEntry({
		wallet,
		transactionId,
		type,
		direction: "debit",
		amount,
		description,
	});
	commit();
}

export function block(wallet: MockWallet, amount: number) {
	wallet.available_balance -= amount;
	wallet.blocked_balance += amount;
	touchWallet(wallet);
	commit();
}

export function settleBlocked({
	wallet,
	amount,
	transactionId,
	type,
	description,
}: Movement) {
	wallet.blocked_balance -= amount;
	touchWallet(wallet);
	recordEntry({
		wallet,
		transactionId,
		type,
		direction: "debit",
		amount,
		description,
	});
	commit();
}
