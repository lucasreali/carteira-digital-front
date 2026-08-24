import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
	CreatePixChargePayload,
	CreatePixKeyPayload,
	PixPaymentPayload,
} from "@/api/endpoints/pix";
import { pixEndpoints } from "@/api/endpoints/pix";
import { invalidationRoots, queryKeys } from "./keys";

export function usePixKeys() {
	return useQuery({
		queryKey: queryKeys.pixKeys,
		queryFn: pixEndpoints.listKeys,
	});
}

export function usePixCharge(chargeId: string, pollWhileActive = false) {
	return useQuery({
		queryKey: queryKeys.pixCharge(chargeId),
		queryFn: () => pixEndpoints.getCharge(chargeId),
		enabled: Boolean(chargeId),
		refetchInterval: pollWhileActive ? 4_000 : false,
	});
}

export function useCreatePixKey() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: CreatePixKeyPayload) => pixEndpoints.createKey(body),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: invalidationRoots.pix }),
	});
}

export function useRemovePixKey() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: pixEndpoints.removeKey,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: invalidationRoots.pix }),
	});
}

export function useCreatePixCharge() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: CreatePixChargePayload) =>
			pixEndpoints.createCharge(body),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: invalidationRoots.pix }),
	});
}

export function useCancelPixCharge() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: pixEndpoints.cancelCharge,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: invalidationRoots.pix }),
	});
}

export function usePixPayment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: PixPaymentPayload) => pixEndpoints.pay(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invalidationRoots.wallets });
			queryClient.invalidateQueries({
				queryKey: invalidationRoots.transactions,
			});
		},
	});
}
