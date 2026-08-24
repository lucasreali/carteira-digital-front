import type { MockWallet } from "../db";
import { commit, db, newId, nowIso } from "../db";
import { route } from "../router";
import { findWallet, notFound, requireUser, totalOf, unauthorized, walletsOf } from "../shared";
import { fail, json, noContent, paginate, toWallet, touchWallet } from "../support";

route("GET", "/wallets", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const currency = context.query.get("currency");
	const status = context.query.get("status");
	const wallets = db()
		.wallets.filter((wallet) => wallet.user_id === user.id)
		.filter((wallet) => (currency ? wallet.currency === currency : true))
		.filter((wallet) => (status ? wallet.status === status : wallet.status !== "closed"))
		.map(toWallet);

	return json(paginate(wallets, context.query.get("limit"), context.query.get("cursor")));
});

route("POST", "/wallets", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();
	if (user.kyc_status !== "approved") {
		return fail(
			403,
			"kyc_required",
			"Conclua a verificação de identidade para criar novas carteiras.",
		);
	}

	const payload = await context.body();
	const wallet: MockWallet = {
		id: newId(),
		user_id: user.id,
		alias: String(payload.alias ?? "Nova carteira"),
		currency: String(payload.currency ?? "BRL"),
		available_balance: 0,
		blocked_balance: 0,
		is_default: Boolean(payload.is_default),
		status: "active",
		created_at: nowIso(),
		updated_at: nowIso(),
		version: 1,
	};

	if (wallet.is_default) {
		for (const other of walletsOf(user)) other.is_default = false;
	}
	db().wallets.push(wallet);
	commit();

	return json(toWallet(wallet), 201);
});

route("GET", "/wallets/:walletId", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const wallet = findWallet(user, context.params.walletId);
	return wallet ? json(toWallet(wallet)) : notFound();
});

route("PATCH", "/wallets/:walletId", async (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const wallet = findWallet(user, context.params.walletId);
	if (!wallet) return notFound();

	const ifMatch = context.request.headers.get("If-Match");
	if (ifMatch && Number(ifMatch) !== wallet.version) {
		return fail(409, "version_conflict", "O recurso foi modificado. Recarregue e tente novamente.", [
			{ field: "version", issue: `esperado ${ifMatch}, atual ${wallet.version}` },
		]);
	}

	const payload = await context.body();
	if (payload.alias) wallet.alias = String(payload.alias);
	if (payload.status) wallet.status = payload.status as MockWallet["status"];
	if (payload.is_default === true) {
		for (const other of walletsOf(user)) other.is_default = false;
		wallet.is_default = true;
	}
	touchWallet(wallet);
	commit();

	return json(toWallet(wallet));
});

route("DELETE", "/wallets/:walletId", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const wallet = findWallet(user, context.params.walletId);
	if (!wallet) return notFound();
	if (totalOf(wallet) > 0) {
		return fail(409, "wallet_not_empty", "Transfira o saldo antes de encerrar a carteira.", [
			{ field: "total_balance", issue: String(totalOf(wallet)) },
		]);
	}
	if (wallet.is_default) {
		return fail(409, "wallet_not_empty", "A carteira padrão não pode ser encerrada.", [
			{ field: "is_default", issue: "true" },
		]);
	}

	wallet.status = "closed";
	touchWallet(wallet);
	commit();

	return noContent();
});

route("GET", "/wallets/:walletId/balance", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const wallet = findWallet(user, context.params.walletId);
	if (!wallet) return notFound();

	const pendingCredits = db()
		.transactions.filter(
			(transaction) =>
				transaction.destination_wallet_id === wallet.id && transaction.status === "pending",
		)
		.reduce((total, transaction) => total + transaction.amount, 0);

	return json({
		wallet_id: wallet.id,
		currency: wallet.currency,
		available_balance: wallet.available_balance,
		blocked_balance: wallet.blocked_balance,
		pending_credits: pendingCredits,
		total_balance: totalOf(wallet),
		updated_at: wallet.updated_at,
	});
});

route("GET", "/wallets/:walletId/statement", (context) => {
	const user = requireUser(context);
	if (!user) return unauthorized();

	const wallet = findWallet(user, context.params.walletId);
	if (!wallet) return notFound();

	const from = context.query.get("from");
	const to = context.query.get("to");
	const entries = db()
		.entries.filter((entry) => entry.wallet_id === wallet.id)
		.filter((entry) => (from ? entry.created_at >= `${from}T00:00:00.000Z` : true))
		.filter((entry) => (to ? entry.created_at <= `${to}T23:59:59.999Z` : true))
		.sort((left, right) => right.created_at.localeCompare(left.created_at));

	const oldest = entries.at(-1);
	const openingBalance = oldest
		? oldest.direction === "credit"
			? oldest.balance_after - oldest.amount
			: oldest.balance_after + oldest.amount
		: totalOf(wallet);

	return json({
		wallet_id: wallet.id,
		opening_balance: openingBalance,
		closing_balance: entries[0]?.balance_after ?? totalOf(wallet),
		...paginate(entries, context.query.get("limit"), context.query.get("cursor")),
	});
});
