import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CreatePaymentMethodPayload } from "@/api/endpoints/payment-methods";
import { paymentMethodEndpoints } from "@/api/endpoints/payment-methods";
import { invalidationRoots, queryKeys } from "./keys";

export function usePaymentMethods(filters: { type?: string } = {}) {
	return useQuery({
		queryKey: queryKeys.paymentMethods(filters),
		queryFn: () => paymentMethodEndpoints.list(filters),
	});
}

function useInvalidatePaymentMethods() {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries({
			queryKey: invalidationRoots.paymentMethods,
		});
}

export function useCreatePaymentMethod() {
	const invalidate = useInvalidatePaymentMethods();
	return useMutation({
		mutationFn: (body: CreatePaymentMethodPayload) =>
			paymentMethodEndpoints.create(body),
		onSuccess: invalidate,
	});
}

export function useUpdatePaymentMethod() {
	const invalidate = useInvalidatePaymentMethods();
	return useMutation({
		mutationFn: (input: {
			paymentMethodId: string;
			body: { is_default?: boolean; exp_month?: number; exp_year?: number };
		}) => paymentMethodEndpoints.update(input.paymentMethodId, input.body),
		onSuccess: invalidate,
	});
}

export function useRemovePaymentMethod() {
	const invalidate = useInvalidatePaymentMethods();
	return useMutation({
		mutationFn: paymentMethodEndpoints.remove,
		onSuccess: invalidate,
	});
}
