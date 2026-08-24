import { zodResolver } from "@hookform/resolvers/zod";
import { IconPencil, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
	useCreateBeneficiary,
	useUpdateBeneficiary,
} from "@/api/queries/beneficiaries";
import {
	type Beneficiary,
	type CreateBeneficiaryForm,
	createBeneficiaryFormSchema,
	type UpdateBeneficiaryForm,
	updateBeneficiaryFormSchema,
} from "@/api/schemas/beneficiary";
import { FormRow, SwitchRow } from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { reportApiError } from "@/lib/form";

type CreateBeneficiaryPayload = z.output<typeof createBeneficiaryFormSchema>;

export function CreateBeneficiaryDialog() {
	const [open, setOpen] = useState(false);
	const createBeneficiary = useCreateBeneficiary();

	const form = useForm<
		CreateBeneficiaryForm,
		unknown,
		CreateBeneficiaryPayload
	>({
		resolver: zodResolver(createBeneficiaryFormSchema),
		defaultValues: {
			nickname: "",
			pix_key: "",
			bank_code: "",
			agency: "",
			account_number: "",
			is_favorite: false,
		},
	});
	const { errors } = form.formState;

	const submit = form.handleSubmit(async (values) => {
		try {
			await createBeneficiary.mutateAsync(values);
			toast.success("Favorecido salvo.");
			form.reset();
			setOpen(false);
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["nickname", "pix_key"],
			});
		}
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size="sm" />}>
				<IconPlus />
				Novo favorecido
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Novo favorecido</DialogTitle>
					<DialogDescription>
						Informe uma chave Pix ou os dados bancários completos.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={submit} noValidate>
					<FieldGroup>
						<FormRow
							label="Apelido"
							htmlFor="nickname"
							error={errors.nickname?.message}
						>
							<Input
								id="nickname"
								placeholder="Bruno (aluguel)"
								className="h-9 text-sm"
								aria-invalid={Boolean(errors.nickname)}
								{...form.register("nickname")}
							/>
						</FormRow>

						<FormRow
							label="Chave Pix"
							htmlFor="pix_key"
							error={errors.pix_key?.message}
						>
							<Input
								id="pix_key"
								placeholder="bruno.lima@example.com"
								className="h-9 text-sm"
								aria-invalid={Boolean(errors.pix_key)}
								{...form.register("pix_key")}
							/>
						</FormRow>

						<FieldSeparator>ou dados bancários</FieldSeparator>

						<div className="grid gap-4 sm:grid-cols-3">
							<FormRow
								label="Banco"
								htmlFor="bank_code"
								error={errors.bank_code?.message}
							>
								<Input
									id="bank_code"
									inputMode="numeric"
									maxLength={3}
									placeholder="260"
									className="h-9 text-sm"
									{...form.register("bank_code")}
								/>
							</FormRow>
							<FormRow
								label="Agência"
								htmlFor="agency"
								error={errors.agency?.message}
							>
								<Input
									id="agency"
									inputMode="numeric"
									placeholder="0001"
									className="h-9 text-sm"
									{...form.register("agency")}
								/>
							</FormRow>
							<FormRow
								label="Conta"
								htmlFor="account_number"
								error={errors.account_number?.message}
							>
								<Input
									id="account_number"
									inputMode="numeric"
									placeholder="123456"
									className="h-9 text-sm"
									{...form.register("account_number")}
								/>
							</FormRow>
						</div>

						<Controller
							control={form.control}
							name="is_favorite"
							render={({ field }) => (
								<SwitchRow
									label="Marcar como favorito"
									description="Favoritos aparecem primeiro na lista."
									checked={Boolean(field.value)}
									onChange={field.onChange}
								/>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={() => setOpen(false)}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={createBeneficiary.isPending}>
								{createBeneficiary.isPending ? <Spinner /> : null}
								Salvar
							</Button>
						</DialogFooter>
					</FieldGroup>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function EditBeneficiaryDialog({
	beneficiary,
}: {
	beneficiary: Beneficiary;
}) {
	const [open, setOpen] = useState(false);
	const updateBeneficiary = useUpdateBeneficiary();

	const form = useForm<UpdateBeneficiaryForm>({
		resolver: zodResolver(updateBeneficiaryFormSchema),
		values: {
			nickname: beneficiary.nickname,
			is_favorite: beneficiary.is_favorite,
		},
	});

	const submit = form.handleSubmit(async (values) => {
		try {
			await updateBeneficiary.mutateAsync({
				beneficiaryId: beneficiary.id,
				body: values,
			});
			toast.success("Favorecido atualizado.");
			setOpen(false);
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["nickname"],
			});
		}
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Editar favorecido"
					/>
				}
			>
				<IconPencil />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar favorecido</DialogTitle>
					<DialogDescription>Apelido e destaque na lista.</DialogDescription>
				</DialogHeader>

				<form onSubmit={submit} noValidate>
					<FieldGroup>
						<FormRow
							label="Apelido"
							htmlFor="edit-nickname"
							error={form.formState.errors.nickname?.message}
						>
							<Input
								id="edit-nickname"
								className="h-9 text-sm"
								aria-invalid={Boolean(form.formState.errors.nickname)}
								{...form.register("nickname")}
							/>
						</FormRow>

						<Controller
							control={form.control}
							name="is_favorite"
							render={({ field }) => (
								<SwitchRow
									label="Favorito"
									checked={field.value}
									onChange={field.onChange}
								/>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={() => setOpen(false)}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={updateBeneficiary.isPending}>
								{updateBeneficiary.isPending ? <Spinner /> : null}
								Salvar
							</Button>
						</DialogFooter>
					</FieldGroup>
				</form>
			</DialogContent>
		</Dialog>
	);
}
