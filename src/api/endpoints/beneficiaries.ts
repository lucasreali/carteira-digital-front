import { request } from "@/api/http";
import { beneficiarySchema } from "@/api/schemas/beneficiary";
import { pageOf } from "@/api/schemas/common";

export type CreateBeneficiaryPayload = {
	nickname: string;
	pix_key?: string;
	bank_code?: string;
	agency?: string;
	account_number?: string;
	is_favorite?: boolean;
};

export const beneficiaryEndpoints = {
	list: (query: { search?: string; limit?: number; cursor?: string } = {}) =>
		request({ path: "/beneficiaries", query, schema: pageOf(beneficiarySchema) }),

	create: (body: CreateBeneficiaryPayload) =>
		request({ path: "/beneficiaries", method: "POST", body, schema: beneficiarySchema }),

	update: (beneficiaryId: string, body: { nickname?: string; is_favorite?: boolean }) =>
		request({
			path: `/beneficiaries/${beneficiaryId}`,
			method: "PATCH",
			body,
			schema: beneficiarySchema,
		}),

	remove: (beneficiaryId: string) =>
		request({ path: `/beneficiaries/${beneficiaryId}`, method: "DELETE" }),
};
