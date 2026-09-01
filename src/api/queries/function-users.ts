import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import type {
	FunctionUserPatch,
	FunctionUserPayload,
} from "@/api/endpoints/function-users";
import { functionUserEndpoints } from "@/api/endpoints/function-users";
import { functionCallLog } from "@/api/function-call-log";
import { functionUserIds } from "@/api/function-user-ids";
import { queryKeys } from "./keys";

export function useFunctionUserIds() {
	return useSyncExternalStore(
		functionUserIds.subscribe,
		functionUserIds.read,
		functionUserIds.readOnServer,
	);
}

export function useFunctionCalls() {
	return useSyncExternalStore(
		functionCallLog.subscribe,
		functionCallLog.read,
		functionCallLog.readOnServer,
	);
}

export function useFunctionUser(userId: string) {
	return useQuery({
		queryKey: queryKeys.functionUser(userId),
		queryFn: () => functionUserEndpoints.read(userId),
	});
}

function useRefreshFunctionUser() {
	const queryClient = useQueryClient();
	return (userId: string) =>
		queryClient.invalidateQueries({ queryKey: queryKeys.functionUser(userId) });
}

export function useCreateFunctionUser() {
	return useMutation({
		mutationFn: (body: FunctionUserPayload) =>
			functionUserEndpoints.create(body),
		onSuccess: (user) => functionUserIds.remember(user._id),
	});
}

export function useReplaceFunctionUser() {
	const refresh = useRefreshFunctionUser();
	return useMutation({
		mutationFn: (input: { userId: string; body: FunctionUserPayload }) =>
			functionUserEndpoints.replace(input.userId, input.body),
		onSuccess: (_user, input) => refresh(input.userId),
	});
}

export function useUpdateFunctionUser() {
	const refresh = useRefreshFunctionUser();
	return useMutation({
		mutationFn: (input: { userId: string; body: FunctionUserPatch }) =>
			functionUserEndpoints.update(input.userId, input.body),
		onSuccess: (_user, input) => refresh(input.userId),
	});
}

export function useRemoveFunctionUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: functionUserEndpoints.remove,
		onSuccess: (_result, userId) => {
			functionUserIds.forget(userId);
			queryClient.removeQueries({ queryKey: queryKeys.functionUser(userId) });
		},
	});
}

export function useFindFunctionUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (userId: string) =>
			queryClient.fetchQuery({
				queryKey: queryKeys.functionUser(userId),
				queryFn: () => functionUserEndpoints.read(userId),
				staleTime: 0,
			}),
		onSuccess: (user) => functionUserIds.remember(user._id),
	});
}
