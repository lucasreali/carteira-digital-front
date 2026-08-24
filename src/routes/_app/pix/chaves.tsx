import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft, IconKey, IconTrash } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
	useCreatePixKey,
	usePixKeys,
	useRemovePixKey,
} from "@/api/queries/pix";
import {
	type CreatePixKeyForm,
	createPixKeyFormSchema,
} from "@/api/schemas/pix";
import { ButtonLink } from "@/components/common/button-link";
import { CopyButton } from "@/components/common/copy-button";
import {
	EmptyState,
	ErrorState,
	LoadingRows,
} from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { FormRow, SelectInput } from "@/components/form/fields";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { WalletSelect } from "@/components/wallets/wallet-select";
import { describeError, reportApiError } from "@/lib/form";
import { formatDate } from "@/lib/format";
import {
	optionsFrom,
	pixKeyStatusLabels,
	pixKeyTypeLabels,
} from "@/lib/labels";

export const Route = createFileRoute("/_app/pix/chaves")({
	component: PixKeysScreen,
});

const typeOptions = optionsFrom(pixKeyTypeLabels);

const placeholders: Record<string, string> = {
	cpf: "000.000.000-00",
	cnpj: "00.000.000/0000-00",
	email: "voce@exemplo.com",
	phone: "(41) 99999-8888",
	random: "Gerada automaticamente",
};

function PixKeysScreen() {
	const keys = usePixKeys();
	const createKey = useCreatePixKey();
	const removeKey = useRemovePixKey();

	const form = useForm<CreatePixKeyForm>({
		resolver: zodResolver(createPixKeyFormSchema),
		defaultValues: { type: "email", value: "", wallet_id: "" },
	});
	const type = form.watch("type");
	const { errors } = form.formState;

	const submit = form.handleSubmit(async (values) => {
		try {
			await createKey.mutateAsync({
				type: values.type,
				value: values.type === "random" ? undefined : values.value,
				wallet_id: values.wallet_id,
			});
			toast.success("Chave Pix cadastrada.");
			form.reset({ type: "email", value: "", wallet_id: values.wallet_id });
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["value"],
			});
		}
	});

	async function remove(pixKeyId: string) {
		try {
			await removeKey.mutateAsync(pixKeyId);
			toast.success("Chave excluída.");
		} catch (error) {
			toast.error(describeError(error));
		}
	}

	const items = keys.data?.data ?? [];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Chaves Pix"
				description="Cada chave aponta para uma carteira. Limite de 5 chaves por titular."
				actions={
					<ButtonLink variant="ghost" size="sm" to="/pix">
						<IconArrowLeft />
						Pix
					</ButtonLink>
				}
			/>

			<div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
				<Card>
					<CardHeader>
						<CardTitle>Chaves cadastradas</CardTitle>
					</CardHeader>
					<CardContent>
						{keys.isPending ? (
							<LoadingRows rows={3} />
						) : keys.isError ? (
							<ErrorState error={keys.error} onRetry={() => keys.refetch()} />
						) : items.length === 0 ? (
							<EmptyState
								icon={<IconKey />}
								title="Nenhuma chave cadastrada"
								description="Use o formulário ao lado para criar a primeira."
							/>
						) : (
							<ul className="divide-y divide-border/60">
								{items.map((key) => (
									<li key={key.id} className="flex items-center gap-3 py-3">
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-sm">
												{key.value}
											</p>
											<p className="text-muted-foreground text-xs">
												{pixKeyTypeLabels[key.type]} · desde{" "}
												{formatDate(key.created_at)}
											</p>
										</div>
										<StatusBadge
											status={key.status}
											label={pixKeyStatusLabels[key.status]}
										/>
										<CopyButton
											value={key.value}
											size="icon-sm"
											label="Copiar chave"
										/>
										<AlertDialog>
											<AlertDialogTrigger
												render={
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label="Excluir chave"
													/>
												}
											>
												<IconTrash />
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Excluir chave Pix?
													</AlertDialogTitle>
													<AlertDialogDescription>
														Pagamentos enviados para esta chave deixarão de
														chegar na sua carteira.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancelar</AlertDialogCancel>
													<AlertDialogAction onClick={() => remove(key.id)}>
														Excluir
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card className="h-fit">
					<CardHeader>
						<CardTitle>Nova chave</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={submit} noValidate>
							<FieldGroup>
								<Controller
									control={form.control}
									name="type"
									render={({ field }) => (
										<FormRow
											label="Tipo"
											htmlFor="key-type"
											error={errors.type?.message}
										>
											<SelectInput
												id="key-type"
												value={field.value}
												onChange={field.onChange}
												options={typeOptions}
											/>
										</FormRow>
									)}
								/>

								<FormRow
									label="Valor"
									htmlFor="key-value"
									error={errors.value?.message}
								>
									<Input
										id="key-value"
										placeholder={placeholders[type]}
										disabled={type === "random"}
										className="h-9 text-sm"
										aria-invalid={Boolean(errors.value)}
										{...form.register("value")}
									/>
								</FormRow>

								<Controller
									control={form.control}
									name="wallet_id"
									render={({ field }) => (
										<FormRow
											label="Carteira vinculada"
											htmlFor="key-wallet"
											error={errors.wallet_id?.message}
										>
											<WalletSelect
												id="key-wallet"
												value={field.value}
												onChange={field.onChange}
												invalid={Boolean(errors.wallet_id)}
												withBalance={false}
											/>
										</FormRow>
									)}
								/>

								<Button type="submit" disabled={createKey.isPending}>
									{createKey.isPending ? <Spinner /> : null}
									Cadastrar chave
								</Button>
							</FieldGroup>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
