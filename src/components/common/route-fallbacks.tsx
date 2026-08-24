import { IconAlertTriangle, IconMoodEmpty } from "@tabler/icons-react";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { ButtonLink } from "@/components/common/button-link";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { describeError } from "@/lib/form";

export function RouteNotFound() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center p-6">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<IconMoodEmpty />
					</EmptyMedia>
					<EmptyTitle>Página não encontrada</EmptyTitle>
					<EmptyDescription>
						O endereço acessado não existe ou foi movido. Volte para o início e
						tente de novo.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<ButtonLink to="/" size="sm">
						Ir para o início
					</ButtonLink>
				</EmptyContent>
			</Empty>
		</div>
	);
}

export function RouteError({ error, reset }: ErrorComponentProps) {
	return (
		<div className="flex min-h-[60vh] items-center justify-center p-6">
			<Empty className="border border-destructive/30 border-dashed">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<IconAlertTriangle className="text-destructive" />
					</EmptyMedia>
					<EmptyTitle>Algo deu errado</EmptyTitle>
					<EmptyDescription>{describeError(error)}</EmptyDescription>
				</EmptyHeader>
				<EmptyContent className="flex-row gap-2">
					<Button size="sm" variant="outline" onClick={reset}>
						Tentar novamente
					</Button>
					<ButtonLink to="/" size="sm">
						Ir para o início
					</ButtonLink>
				</EmptyContent>
			</Empty>
		</div>
	);
}
