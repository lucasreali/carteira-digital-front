import { authSessionSchema, tokenPairSchema } from "@/api/schemas/auth";
import { request } from "@/api/http";

export type RegisterPayload = {
	full_name: string;
	email: string;
	document: string;
	phone?: string;
	password: string;
	birth_date?: string;
};

export const authEndpoints = {
	register: (body: RegisterPayload) =>
		request({ path: "/auth/register", method: "POST", body, schema: authSessionSchema, anonymous: true }),

	login: (body: { email: string; password: string; device_id?: string }) =>
		request({ path: "/auth/login", method: "POST", body, schema: authSessionSchema, anonymous: true }),

	refresh: (refresh_token: string) =>
		request({
			path: "/auth/refresh",
			method: "POST",
			body: { refresh_token },
			schema: tokenPairSchema,
			anonymous: true,
		}),

	logout: (all_devices = false) =>
		request({ path: "/auth/logout", method: "POST", body: { all_devices } }),
};
