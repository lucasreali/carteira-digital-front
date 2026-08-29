import { IconCloudComputing, IconRefresh } from "@tabler/icons-react";

import { useServiceStatus } from "@/api/queries/service-status";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const UNEXPECTED = "Falha inesperada ao consultar a função.";

function describeFailure(error: unknown) {
	return error instanceof Error ? error.message : UNEXPECTED;
}

export function ServiceStatusCard({ name = "" }: { name?: string }) {
	const status = useServiceStatus(name);

	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<IconCloudComputing className="size-4 text-primary" />
					Status do serviço
				</CardTitle>
				<CardDescription>
					Resposta da Azure Function <code>/api/getstatus</code>
				</CardDescription>
				<CardAction>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Consultar novamente"
						disabled={status.isFetching}
						onClick={() => status.refetch()}
					>
						<IconRefresh />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				{status.isPending ? (
					<Skeleton className="h-6 w-48" />
				) : status.isError ? (
					<p className="text-destructive text-sm">
						{describeFailure(status.error)}
					</p>
				) : (
					<p className="font-mono text-foreground text-sm">{status.data}</p>
				)}
			</CardContent>
		</Card>
	);
}
