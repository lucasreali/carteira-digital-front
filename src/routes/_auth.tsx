import {
	IconShieldLock,
	IconTrendingUp,
	IconWallet,
} from "@tabler/icons-react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { sessionStore } from "@/auth/session";

export const Route = createFileRoute("/_auth")({
	ssr: false,
	beforeLoad: () => {
		if (sessionStore.read()) throw redirect({ to: "/inicio" });
	},
	component: AuthLayout,
});

const highlights = [
	{
		icon: IconWallet,
		title: "Múltiplas carteiras",
		description: "Separe o dia a dia da reserva com saldos independentes.",
	},
	{
		icon: IconTrendingUp,
		title: "Pix e transferências",
		description: "Chaves, cobranças com QR Code e envio instantâneo.",
	},
	{
		icon: IconShieldLock,
		title: "Operações idempotentes",
		description: "Cada movimentação de dinheiro carrega sua própria chave.",
	},
];

function AuthLayout() {
	return (
		<div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
			<aside className="relative hidden overflow-hidden bg-sidebar p-12 lg:flex lg:flex-col lg:justify-between">
				<div
					aria-hidden
					className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--primary),transparent_55%)] opacity-[0.18]"
				/>
				<div className="relative flex items-center gap-2">
					<span className="flex size-8 items-center justify-center bg-primary text-primary-foreground">
						<IconWallet className="size-5" />
					</span>
					<span className="font-heading font-semibold text-lg tracking-tight">
						Carteira Digital
					</span>
				</div>

				<div className="relative max-w-md space-y-8">
					<h2 className="font-heading font-semibold text-3xl leading-tight tracking-tight">
						Seu dinheiro em centavos, sem arredondamento e sem surpresa.
					</h2>
					<ul className="space-y-5">
						{highlights.map((highlight) => (
							<li key={highlight.title} className="flex gap-3">
								<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-primary/10 text-primary">
									<highlight.icon className="size-4" />
								</span>
								<div className="space-y-0.5">
									<p className="font-medium text-sm">{highlight.title}</p>
									<p className="text-muted-foreground text-sm">
										{highlight.description}
									</p>
								</div>
							</li>
						))}
					</ul>
				</div>

				<p className="relative text-muted-foreground text-xs">
					Ambiente de demonstração — valores fictícios, mesmos contratos da API.
				</p>
			</aside>

			<main className="flex items-center justify-center p-6 sm:p-10">
				<div className="w-full max-w-sm">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
