import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { webhookEndpoints } from "@/api/endpoints/webhooks";
import { invalidationRoots, queryKeys } from "./keys";

export function useWebhooks() {
	return useQuery({
		queryKey: queryKeys.webhooks,
		queryFn: webhookEndpoints.list,
	});
}

export function useCreateWebhook() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: { url: string; events: ReadonlyArray<string> }) =>
			webhookEndpoints.create(body),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: invalidationRoots.webhooks }),
	});
}

export function useRemoveWebhook() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: webhookEndpoints.remove,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: invalidationRoots.webhooks }),
	});
}
