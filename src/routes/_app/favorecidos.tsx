import {
	IconSearch,
	IconStar,
	IconStarFilled,
	IconTrash,
	IconUsers,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
	useBeneficiaries,
	useRemoveBeneficiary,
	useUpdateBeneficiary,
} from "@/api/queries/beneficiaries";
import {
	CreateBeneficiaryDialog,
	EditBeneficiaryDialog,
} from "@/components/beneficiaries/beneficiary-dialogs";
import {
	EmptyState,
	ErrorState,
	LoadingRows,
} from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
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
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { describeError } from "@/lib/form";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_app/favorecidos")({
	component: BeneficiariesScreen,
});

function BeneficiariesScreen() {
	const [search, setSearch] = useState("");
	const beneficiaries = useBeneficiaries(search);
	const updateBeneficiary = useUpdateBeneficiary();
	const removeBeneficiary = useRemoveBeneficiary();

	const items = beneficiaries.data?.data ?? [];

	async function toggleFavorite(beneficiaryId: string, isFavorite: boolean) {
		try {
			await updateBeneficiary.mutateAsync({
				beneficiaryId,
				body: { is_favorite: !isFavorite },
			});
		} catch (error) {
			toast.error(describeError(error));
		}
	}

	async function remove(beneficiaryId: string) {
		try {
			await removeBeneficiary.mutateAsync(beneficiaryId);
			toast.success("Favorecido removido.");
		} catch (error) {
			toast.error(describeError(error));
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Favorecidos"
				description="Destinatários salvos para transferências e Pix recorrentes."
				actions={<CreateBeneficiaryDialog />}
			/>

			<InputGroup className="max-w-sm">
				<InputGroupAddon>
					<IconSearch className="size-4" />
				</InputGroupAddon>
				<InputGroupInput
					placeholder="Buscar por apelido ou nome"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>
			</InputGroup>

			{beneficiaries.isPending ? (
				<LoadingRows rows={3} />
			) : beneficiaries.isError ? (
				<ErrorState
					error={beneficiaries.error}
					onRetry={() => beneficiaries.refetch()}
				/>
			) : items.length === 0 ? (
				<EmptyState
					icon={<IconUsers />}
					title="Nenhum favorecido"
					description="Salve destinatários frequentes para transferir mais rápido."
					action={<CreateBeneficiaryDialog />}
				/>
			) : (
				<Card>
					<CardContent className="divide-y divide-border/60 p-0">
						{items.map((beneficiary) => (
							<div
								key={beneficiary.id}
								className="flex items-center gap-3 px-4 py-3"
							>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={
										beneficiary.is_favorite
											? "Remover dos favoritos"
											: "Marcar como favorito"
									}
									onClick={() =>
										toggleFavorite(beneficiary.id, beneficiary.is_favorite)
									}
								>
									{beneficiary.is_favorite ? (
										<IconStarFilled className="text-warning" />
									) : (
										<IconStar className="text-muted-foreground" />
									)}
								</Button>

								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sm">
										{beneficiary.nickname}
									</p>
									<p className="truncate text-muted-foreground text-xs">
										{beneficiary.full_name} · {beneficiary.document_masked}
									</p>
									<p className="truncate text-muted-foreground text-xs">
										{beneficiary.pix_key ??
											`Banco ${beneficiary.bank_code ?? "—"}`}{" "}
										· salvo em {formatDate(beneficiary.created_at)}
									</p>
								</div>

								<EditBeneficiaryDialog beneficiary={beneficiary} />

								<AlertDialog>
									<AlertDialogTrigger
										render={
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label="Remover favorecido"
											/>
										}
									>
										<IconTrash />
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												Remover “{beneficiary.nickname}”?
											</AlertDialogTitle>
											<AlertDialogDescription>
												Você poderá salvá-lo novamente a qualquer momento.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancelar</AlertDialogCancel>
											<AlertDialogAction onClick={() => remove(beneficiary.id)}>
												Remover
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						))}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
