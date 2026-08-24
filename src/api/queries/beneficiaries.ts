import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CreateBeneficiaryPayload } from "@/api/endpoints/beneficiaries";
import { beneficiaryEndpoints } from "@/api/endpoints/beneficiaries";
import { invalidationRoots, queryKeys } from "./keys";

export function useBeneficiaries(search = "") {
	return useQuery({
		queryKey: queryKeys.beneficiaries(search),
		queryFn: () => beneficiaryEndpoints.list({ search: search || undefined }),
	});
}

function useInvalidateBeneficiaries() {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries({
			queryKey: invalidationRoots.beneficiaries,
		});
}

export function useCreateBeneficiary() {
	const invalidate = useInvalidateBeneficiaries();
	return useMutation({
		mutationFn: (body: CreateBeneficiaryPayload) =>
			beneficiaryEndpoints.create(body),
		onSuccess: invalidate,
	});
}

export function useUpdateBeneficiary() {
	const invalidate = useInvalidateBeneficiaries();
	return useMutation({
		mutationFn: (input: {
			beneficiaryId: string;
			body: { nickname?: string; is_favorite?: boolean };
		}) => beneficiaryEndpoints.update(input.beneficiaryId, input.body),
		onSuccess: invalidate,
	});
}

export function useRemoveBeneficiary() {
	const invalidate = useInvalidateBeneficiaries();
	return useMutation({
		mutationFn: beneficiaryEndpoints.remove,
		onSuccess: invalidate,
	});
}
