import { IconAlertTriangle, IconInbox } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { describeError } from "@/lib/form";

export function LoadingRows({ rows = 4 }: { rows?: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: rows }, (_, index) => `row-${index}`).map((key) => (
				<Skeleton key={key} className="h-14 w-full" />
			))}
		</div>
	);
}

export function ErrorState({
	error,
	onRetry,
}: {
	error: unknown;
	onRetry?: () => void;
}) {
	return (
		<Empty className="border border-destructive/30 border-dashed">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<IconAlertTriangle className="text-destructive" />
				</EmptyMedia>
				<EmptyTitle>Não foi possível carregar</EmptyTitle>
				<EmptyDescription>{describeError(error)}</EmptyDescription>
			</EmptyHeader>
			{onRetry ? (
				<EmptyContent>
					<Button variant="outline" size="sm" onClick={onRetry}>
						Tentar novamente
					</Button>
				</EmptyContent>
			) : null}
		</Empty>
	);
}

export function EmptyState({
	title,
	description,
	action,
	icon,
}: {
	title: string;
	description?: string;
	action?: ReactNode;
	icon?: ReactNode;
}) {
	return (
		<Empty className="border border-border/60 border-dashed">
			<EmptyHeader>
				<EmptyMedia variant="icon">{icon ?? <IconInbox />}</EmptyMedia>
				<EmptyTitle>{title}</EmptyTitle>
				{description ? (
					<EmptyDescription>{description}</EmptyDescription>
				) : null}
			</EmptyHeader>
			{action ? <EmptyContent>{action}</EmptyContent> : null}
		</Empty>
	);
}
