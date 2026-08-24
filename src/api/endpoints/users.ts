import { request } from "@/api/http";
import { accountClosureSchema, kycSchema, userSchema } from "@/api/schemas/user";

export type UpdateUserPayload = {
	full_name?: string;
	email?: string;
	phone?: string;
	password?: string;
	current_password?: string;
};

export const userEndpoints = {
	me: () => request({ path: "/users/me", schema: userSchema }),

	update: (body: UpdateUserPayload, version?: number) =>
		request({ path: "/users/me", method: "PATCH", body, schema: userSchema, ifMatch: version }),

	close: () => request({ path: "/users/me", method: "DELETE", schema: accountClosureSchema }),

	kyc: () => request({ path: "/users/me/kyc", schema: kycSchema }),

	submitKyc: (formData: FormData) =>
		request({ path: "/users/me/kyc", method: "POST", formData, schema: kycSchema }),
};
