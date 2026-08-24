import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authEndpoints, type RegisterPayload } from "@/api/endpoints/auth";
import { sessionFrom, sessionStore } from "./session";

function deviceId() {
	if (typeof navigator === "undefined") return undefined;
	return `web:${navigator.platform || "unknown"}`;
}

export function useLogin() {
	return useMutation({
		mutationFn: (input: { email: string; password: string }) =>
			authEndpoints.login({ ...input, device_id: deviceId() }),
		onSuccess: (session) => sessionStore.save(sessionFrom(session)),
	});
}

export function useRegister() {
	return useMutation({
		mutationFn: (body: RegisterPayload) => authEndpoints.register(body),
		onSuccess: (session) => sessionStore.save(sessionFrom(session)),
	});
}

export function useLogout() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (allDevices?: boolean) =>
			authEndpoints.logout(allDevices ?? false),
		onSettled: () => {
			sessionStore.clear();
			queryClient.clear();
		},
	});
}
