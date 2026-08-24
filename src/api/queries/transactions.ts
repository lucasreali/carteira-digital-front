import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
	DepositPayload,
	ReversalPayload,
	TransactionFilters,
	TransferPayload,
	WithdrawalPayload,
} from "@/api/endpoints/transactions";
import { transactionEndpoints } from "@/api/endpoints/transactions";
import { invalidationRoots, queryKeys } from "./keys";

function useMoneyMovement<TVariables, TResult>(
	mutationFn: (variables: TVariables) => Promise<TResult>,
) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invalidationRoots.wallets });
			queryClient.invalidateQueries({
				queryKey: invalidationRoots.transactions,
			});
		},
	});
}

export function useTransactions(filters: TransactionFilters = {}) {
	return useQuery({
		queryKey: queryKeys.transactions(filters),
		queryFn: () => transactionEndpoints.list(filters),
	});
}

const SETTLING_STATUSES = ["pending", "processing"];

export function useTransaction(transactionId: string) {
	return useQuery({
		queryKey: queryKeys.transaction(transactionId),
		queryFn: () => transactionEndpoints.get(transactionId),
		enabled: Boolean(transactionId),
		refetchInterval: (query) =>
			SETTLING_STATUSES.includes(query.state.data?.status ?? "")
				? 4_000
				: false,
	});
}

export function useDeposit() {
	return useMoneyMovement((input: { walletId: string; body: DepositPayload }) =>
		transactionEndpoints.deposit(input.walletId, input.body),
	);
}

export function useWithdrawal() {
	return useMoneyMovement(
		(input: { walletId: string; body: WithdrawalPayload }) =>
			transactionEndpoints.withdraw(input.walletId, input.body),
	);
}

export function useTransfer() {
	return useMoneyMovement((body: TransferPayload) =>
		transactionEndpoints.transfer(body),
	);
}

export function useReversal(transactionId: string) {
	return useMoneyMovement((body: ReversalPayload) =>
		transactionEndpoints.reverse(transactionId, body),
	);
}
