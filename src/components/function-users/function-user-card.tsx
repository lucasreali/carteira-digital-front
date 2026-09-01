import { IconRefresh, IconTrash, IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { functionUserIds } from "@/api/function-user-ids";
import {
	useFunctionUser,
	useRemoveFunctionUser,
} from "@/api/queries/function-users";
import { CopyButton } from "@/components/common/copy-button";
import { EditFunctionUserDialog } from "@/components/function-users/function-user-dialogs";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { describeError } from "@/lib/form";
import { formatDateTime } from "@/lib/format";

function CardShell({ children }: { children: ReactNode }) {
	return (
		<Card size="sm">
			<CardContent className="space-y-3">{children}</CardContent>
		</Card>
	);
}

function UserIdLine({ userId }: { userId: string }) {
	return (
		<div className="flex items-center gap-1">
			<code className="truncate font-mono text-muted-foreground text-xs">
				{userId}
			</code>
			<CopyButton value={userId} size="icon-sm" label="Copiar o ObjectId" />
		</div>
	);
}

export function FunctionUserCard({ userId }: { userId: string }) {
	const user = useFunctionUser(userId);
	const removeUser = useRemoveFunctionUser();

	async function remove() {
		try {
			await removeUser.mutateAsync(userId);
			toast.success("Usuário removido.");
		} catch (error) {
			toast.error(describeError(error));
		}
	}

	if (user.isPending) {
		return (
			<CardShell>
				<Skeleton className="h-5 w-40" />
				<Skeleton className="h-4 w-56" />
				<Skeleton className="h-4 w-32" />
			</CardShell>
		);
	}

	if (user.isError) {
		return (
			<CardShell>
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 space-y-1">
						<p className="font-medium text-destructive text-sm">
							{describeError(user.error)}
						</p>
						<UserIdLine userId={userId} />
					</div>
					<div className="flex shrink-0 items-center">
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Consultar novamente"
							onClick={() => user.refetch()}
						>
							<IconRefresh />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Remover da lista local"
							onClick={() => functionUserIds.forget(userId)}
						>
							<IconX />
						</Button>
					</div>
				</div>
			</CardShell>
		);
	}

	return (
		<CardShell>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 space-y-1">
					<p className="truncate font-medium text-sm">{user.data.nome}</p>
					<p className="truncate text-muted-foreground text-xs">
						{user.data.email}
					</p>
					<UserIdLine userId={user.data._id} />
				</div>

				<div className="flex shrink-0 items-center">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Consultar novamente (GET)"
						disabled={user.isFetching}
						onClick={() => user.refetch()}
					>
						<IconRefresh />
					</Button>
					<EditFunctionUserDialog user={user.data} mode="patch" />
					<EditFunctionUserDialog user={user.data} mode="put" />

					<AlertDialog>
						<AlertDialogTrigger
							render={
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Excluir usuário (DELETE)"
								/>
							}
						>
							<IconTrash />
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Excluir “{user.data.nome}”?</AlertDialogTitle>
								<AlertDialogDescription>
									DELETE /users/{"{id}"} remove o documento do MongoDB Atlas.
									Não há como desfazer.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>
								<AlertDialogAction onClick={remove}>Excluir</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			<dl className="grid grid-cols-2 gap-2 border-border/60 border-t pt-3 text-xs">
				<div>
					<dt className="text-muted-foreground">Criado em</dt>
					<dd>{formatDateTime(user.data.criadoEm)}</dd>
				</div>
				<div>
					<dt className="text-muted-foreground">Atualizado em</dt>
					<dd>{formatDateTime(user.data.atualizadoEm)}</dd>
				</div>
			</dl>
		</CardShell>
	);
}
