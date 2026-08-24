import { createFileRoute, redirect } from "@tanstack/react-router";

import { sessionStore } from "@/auth/session";

export const Route = createFileRoute("/")({
	ssr: false,
	beforeLoad: () => {
		throw redirect({ to: sessionStore.read() ? "/inicio" : "/entrar" });
	},
});
