import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import type {
	StatementFilters,
	WalletListFilters,
} from "@/api/endpoints/wallets";
import { walletEndpoints } from "@/api/endpoints/wallets";
import { invalidationRoots, queryKeys } from "./keys";

export function walletsQuery(filters: WalletListFilters = {}) {
	return queryOptions({
		queryKey: queryKeys.wallets(filters),
		queryFn: () => walletEndpoints.list(filters),
	});
}

export function useWallets(filters: WalletListFilters = {}) {
	return useQuery(walletsQuery(filters));
}

export function useWallet(walletId: string) {
	return useQuery({
		queryKey: queryKeys.wallet(walletId),
		queryFn: () => walletEndpoints.get(walletId),
		enabled: Boolean(walletId),
	});
}

export function useBalance(walletId: string) {
	return useQuery({
		queryKey: queryKeys.balance(walletId),
		queryFn: () => walletEndpoints.balance(walletId),
		enabled: Boolean(walletId),
		refetchInterval: 15_000,
	});
}

export function useStatement(walletId: string, filters: StatementFilters = {}) {
	return useQuery({
		queryKey: queryKeys.statement(walletId, filters),
		queryFn: () => walletEndpoints.statement(walletId, filters),
		enabled: Boolean(walletId),
	});
}

export function useCreateWallet() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: walletEndpoints.create,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: invalidationRoots.wallets }),
	});
}

export function useUpdateWallet(walletId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			body: {
				alias?: string;
				is_default?: boolean;
				status?: "active" | "frozen";
			};
			version?: number;
		}) => walletEndpoints.update(walletId, input.body, input.version),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: invalidationRoots.wallets }),
	});
}

export function useCloseWallet() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: walletEndpoints.close,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: invalidationRoots.wallets }),
	});
}
