import type { MockBeneficiary } from "../db";
import { commit, db, newId, nowIso } from "../db";
import { route } from "../router";
import { notFound, requireUser, unauthorized } from "../shared";
import { json, maskDocument, noContent, paginate } from "../support";

function withoutOwner(beneficiary: MockBeneficiary) {
	const { user_id: _ownerId, ...rest } = beneficiary;
	return rest;
}

route("GET", "/beneficiaries", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const search = context.query.get("search")?.toLowerCase();
	const beneficiaries = db()
		.beneficiaries.filter((beneficiary) => beneficiary.user_id === user.id)
		.filter((beneficiary) =>
			search
				? `${beneficiary.nickname} ${beneficiary.full_name}`.toLowerCase().includes(search)
				: true,
		)
		.sort((left, right) => Number(right.is_favorite) - Number(left.is_favorite))
		.map(withoutOwner);

	return json(paginate(beneficiaries, context.query.get("limit"), context.query.get("cursor")));
});

route("POST", "/beneficiaries", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const payload = await context.body();
	const state = db();
	const matchedKey = state.pixKeys.find((key) => key.value === payload.pix_key);
	const owner = state.users.find((candidate) => candidate.id === matchedKey?.user_id);

	const beneficiary: MockBeneficiary = {
		id: `ben_${newId()}`,
		user_id: user.id,
		nickname: String(payload.nickname ?? ""),
		full_name: owner?.full_name ?? String(payload.nickname ?? ""),
		document_masked: owner ? maskDocument(owner.document) : "***.***.***-**",
		pix_key: (payload.pix_key as string) ?? null,
		bank_code: (payload.bank_code as string) ?? null,
		is_favorite: Boolean(payload.is_favorite),
		created_at: nowIso(),
	};
	state.beneficiaries.unshift(beneficiary);
	commit();

	return json(withoutOwner(beneficiary), 201);
});

route("PATCH", "/beneficiaries/:beneficiaryId", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const beneficiary = db().beneficiaries.find(
		(candidate) =>
			candidate.id === context.params.beneficiaryId && candidate.user_id === user.id,
	);
	if (!beneficiary) return notFound();

	const payload = await context.body();
	if (payload.nickname) beneficiary.nickname = String(payload.nickname);
	if (payload.is_favorite !== undefined) beneficiary.is_favorite = Boolean(payload.is_favorite);
	commit();

	return json(withoutOwner(beneficiary));
});

route("DELETE", "/beneficiaries/:beneficiaryId", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const state = db();
	const index = state.beneficiaries.findIndex(
		(candidate) =>
			candidate.id === context.params.beneficiaryId && candidate.user_id === user.id,
	);
	if (index < 0) return notFound();

	state.beneficiaries.splice(index, 1);
	commit();
	return noContent();
});
