import { IconLogout, IconShieldCheck } from "@tabler/icons-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useCloseAccount, useProfile } from "@/api/queries/users";
import { useLogout } from "@/auth/mutations";
import { ErrorState, LoadingRows } from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import {
	ChangeEmailForm,
	ChangePasswordForm,
	PersonalDataForm,
} from "@/components/profile/profile-forms";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { describeError } from "@/lib/form";
import { formatDate, formatDateTime } from "@/lib/format";
import { kycStatusLabels, userStatusLabels } from "@/lib/labels";

export const Route = createFileRoute("/_app/perfil/")({
	component: ProfileScreen,
});

function initialsOf(fullName: string) {
	return fullName
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

function ProfileScreen() {
	const navigate = useNavigate();
	const profile = useProfile();
	const closeAccount = useCloseAccount();
	const logout = useLogout();
	const [scheduledDeletion, setScheduledDeletion] = useState<string | null>(
		null,
	);

	async function requestClosure() {
		try {
			const result = await closeAccount.mutateAsync();
			setScheduledDeletion(result.scheduled_deletion_at);
			toast.success("Encerramento agendado.");
		} catch (error) {
			toast.error(describeError(error));
		}
	}

	async function signOutEverywhere() {
		await logout.mutateAsync(true);
		await navigate({ to: "/entrar" });
	}

	if (profile.isPending) return <LoadingRows rows={4} />;
	if (profile.isError)
		return (
			<ErrorState error={profile.error} onRetry={() => profile.refetch()} />
		);

	const user = profile.data;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Perfil"
				description="Dados do titular, credenciais e encerramento da conta."
				actions={
					<Button
						variant="outline"
						size="sm"
						render={<Link to="/perfil/kyc" />}
					>
						<IconShieldCheck />
						Verificação
					</Button>
				}
			/>

			<Card>
				<CardContent className="flex flex-wrap items-center gap-4 py-6">
					<Avatar className="size-14">
						<AvatarFallback className="bg-primary/15 font-heading text-lg text-primary">
							{initialsOf(user.full_name)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1 space-y-1">
						<p className="font-heading font-semibold text-lg">
							{user.full_name}
						</p>
						<p className="truncate text-muted-foreground text-sm">
							{user.email}
						</p>
						<p className="text-muted-foreground text-xs">
							{user.document_masked} · cliente desde{" "}
							{formatDate(user.created_at)}
						</p>
					</div>
					<div className="flex flex-col items-end gap-1.5">
						<StatusBadge
							status={user.status}
							label={userStatusLabels[user.status]}
						/>
						<StatusBadge
							status={user.kyc_status}
							label={`KYC ${kycStatusLabels[user.kyc_status].toLowerCase()}`}
						/>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-2">
				<PersonalDataForm user={user} />
				<div className="space-y-6">
					<ChangeEmailForm user={user} />
					<ChangePasswordForm user={user} />
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Sessões</CardTitle>
					<CardDescription>
						Encerrar em todos os dispositivos revoga todos os refresh tokens
						ativos.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						variant="outline"
						onClick={signOutEverywhere}
						disabled={logout.isPending}
					>
						<IconLogout />
						Sair de todos os dispositivos
					</Button>
				</CardContent>
			</Card>

			<Card className="border-destructive/40">
				<CardHeader>
					<CardTitle className="text-destructive">Encerrar conta</CardTitle>
					<CardDescription>
						O encerramento é bloqueado se houver saldo positivo ou transação
						pendente. O extrato é retido pelo prazo legal de guarda.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{scheduledDeletion ? (
						<p className="border border-border/60 bg-muted/40 p-3 text-sm">
							Encerramento agendado para {formatDateTime(scheduledDeletion)}.
						</p>
					) : null}
					<AlertDialog>
						<AlertDialogTrigger render={<Button variant="destructive" />}>
							Solicitar encerramento
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Encerrar sua conta?</AlertDialogTitle>
								<AlertDialogDescription>
									A conta entra em estado de encerramento e é excluída após o
									prazo de retenção. Transfira todo o saldo antes de continuar.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>
								<AlertDialogAction
									onClick={requestClosure}
									disabled={closeAccount.isPending}
								>
									Encerrar conta
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</CardContent>
			</Card>
		</div>
	);
}
