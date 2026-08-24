import type { ReactNode } from "react";

type PageHeaderProps = {
	title: string;
	description?: string;
	actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
	return (
		<header className="flex flex-col gap-3 border-border/60 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
			<div className="space-y-1">
				<h1 className="font-heading font-semibold text-2xl tracking-tight">
					{title}
				</h1>
				{description ? (
					<p className="max-w-2xl text-muted-foreground text-sm">
						{description}
					</p>
				) : null}
			</div>
			{actions ? (
				<div className="flex flex-wrap items-center gap-2">{actions}</div>
			) : null}
		</header>
	);
}
