import { functionRequest } from "@/api/function-http";
import { functionUserSchema } from "@/api/schemas/function-user";

export type FunctionUserPayload = { nome: string; email: string };

export type FunctionUserPatch = { nome?: string; email?: string };

export const functionUserEndpoints = {
	create: (body: FunctionUserPayload) =>
		functionRequest({
			path: "/users",
			method: "POST",
			body,
			schema: functionUserSchema,
		}),

	read: (userId: string) =>
		functionRequest({ path: `/users/${userId}`, schema: functionUserSchema }),

	replace: (userId: string, body: FunctionUserPayload) =>
		functionRequest({
			path: `/users/${userId}`,
			method: "PUT",
			body,
			schema: functionUserSchema,
		}),

	update: (userId: string, body: FunctionUserPatch) =>
		functionRequest({
			path: `/users/${userId}`,
			method: "PATCH",
			body,
			schema: functionUserSchema,
		}),

	remove: (userId: string) =>
		functionRequest({ path: `/users/${userId}`, method: "DELETE" }),
};
