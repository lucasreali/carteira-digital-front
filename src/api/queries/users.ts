import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { UpdateUserPayload } from "@/api/endpoints/users";
import { userEndpoints } from "@/api/endpoints/users";
import { sessionStore } from "@/auth/session";
import { invalidationRoots, queryKeys } from "./keys";

export function useProfile() {
	return useQuery({ queryKey: queryKeys.me, queryFn: userEndpoints.me });
}

export function useKyc() {
	return useQuery({ queryKey: queryKeys.kyc, queryFn: userEndpoints.kyc });
}

export function useUpdateProfile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { body: UpdateUserPayload; version?: number }) =>
			userEndpoints.update(input.body, input.version),
		onSuccess: (user) => {
			const session = sessionStore.read();
			if (session) sessionStore.save({ ...session, user });
			queryClient.invalidateQueries({ queryKey: invalidationRoots.me });
		},
	});
}

export function useCloseAccount() {
	return useMutation({ mutationFn: userEndpoints.close });
}

export function useSubmitKyc() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: userEndpoints.submitKyc,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: invalidationRoots.me }),
	});
}
