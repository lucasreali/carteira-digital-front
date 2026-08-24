import {
	IconArrowRight,
	IconKey,
	IconQrcode,
	IconSend,
} from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { usePixKeys } from "@/api/queries/pix";
import {
	EmptyState,
	ErrorState,
	LoadingRows,
} from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pixKeyStatusLabels, pixKeyTypeLabels } from "@/lib/labels";

export const Route = createFileRoute("/_app/pix/")({ component: PixScreen });

const actions = [
	{
		to: "/pix/pagar",
		icon: IconSend,
		title: "Pagar Pix",
		description: "Envie por chave ou pelo código copia-e-cola.",
	},
	{
		to: "/pix/cobrar",
		icon: IconQrcode,
		title: "Cobrar com QR Code",
		description: "Gere uma cobrança com ou sem valor definido.",
	},
	{
		to: "/pix/chaves",
		icon: IconKey,
		title: "Minhas chaves",
		description: "Cadastre até 5 chaves por titular.",
	},
];

function PixScreen() {
	const keys = usePixKeys();
	const items = keys.data?.data ?? [];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Pix"
				description="Chaves, cobranças e pagamentos instantâneos."
			/>

			<div className="grid gap-4 md:grid-cols-3">
				{actions.map((action) => (
					<Link
						key={action.to}
						to={action.to}
						className="group flex flex-col gap-3 border border-border/60 bg-card p-5 transition-colors hover:border-primary/40"
					>
						<span className="flex size-10 items-center justify-center bg-primary/10 text-primary">
							<action.icon className="size-5" />
						</span>
						<div className="space-y-1">
							<p className="flex items-center gap-1 font-medium text-sm">
								{action.title}
								<IconArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
							</p>
							<p className="text-muted-foreground text-xs">
								{action.description}
							</p>
						</div>
					</Link>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Chaves cadastradas</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{keys.isPending ? (
						<LoadingRows rows={2} />
					) : keys.isError ? (
						<ErrorState error={keys.error} onRetry={() => keys.refetch()} />
					) : items.length === 0 ? (
						<EmptyState
							icon={<IconKey />}
							title="Nenhuma chave Pix"
							description="Cadastre uma chave para receber pagamentos."
							action={
								<Button size="sm" render={<Link to="/pix/chaves" />}>
									Cadastrar chave
								</Button>
							}
						/>
					) : (
						<ul className="divide-y divide-border/60">
							{items.map((key) => (
								<li
									key={key.id}
									className="flex items-center justify-between gap-3 py-3"
								>
									<div className="min-w-0">
										<p className="truncate font-medium text-sm">{key.value}</p>
										<p className="text-muted-foreground text-xs">
											{pixKeyTypeLabels[key.type]}
										</p>
									</div>
									<StatusBadge
										status={key.status}
										label={pixKeyStatusLabels[key.status]}
									/>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
