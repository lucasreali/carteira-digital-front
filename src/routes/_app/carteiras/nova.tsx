import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft } from "@tabler/icons-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateWallet } from "@/api/queries/wallets";
import {
	type CreateWalletForm,
	createWalletFormSchema,
} from "@/api/schemas/wallet";
import { ButtonLink } from "@/components/common/button-link";
import { PageHeader } from "@/components/common/page-header";
import { FormRow, SelectInput, SwitchRow } from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { reportApiError } from "@/lib/form";
import { currencyLabels, optionsFrom } from "@/lib/labels";

export const Route = createFileRoute("/_app/carteiras/nova")({
	component: NewWalletScreen,
});

const currencyOptions = optionsFrom(currencyLabels);

function NewWalletScreen() {
	const navigate = useNavigate();
	const createWallet = useCreateWallet();

	const form = useForm<CreateWalletForm>({
		resolver: zodResolver(createWalletFormSchema),
		defaultValues: { alias: "", currency: "BRL", is_default: false },
	});

	const submit = form.handleSubmit(async (values) => {
		try {
			const wallet = await createWallet.mutateAsync(values);
			toast.success("Carteira criada com sucesso.");
			await navigate({
				to: "/carteiras/$walletId",
				params: { walletId: wallet.id },
			});
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["alias", "currency"],
			});
		}
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="Nova carteira"
				description="Separe objetivos diferentes em carteiras independentes."
				actions={
					<ButtonLink variant="ghost" size="sm" to="/carteiras">
						<IconArrowLeft />
						Voltar
					</ButtonLink>
				}
			/>

			<Card className="max-w-xl">
				<CardContent className="pt-6">
					<form onSubmit={submit} noValidate>
						<FieldGroup>
							<FormRow
								label="Apelido"
								htmlFor="alias"
								error={form.formState.errors.alias?.message}
								description="Como você identifica esta carteira. Máximo de 40 caracteres."
							>
								<Input
									id="alias"
									placeholder="Reserva viagem"
									maxLength={40}
									aria-invalid={Boolean(form.formState.errors.alias)}
									className="h-9 text-sm"
									{...form.register("alias")}
								/>
							</FormRow>

							<Controller
								control={form.control}
								name="currency"
								render={({ field }) => (
									<FormRow
										label="Moeda"
										htmlFor="currency"
										error={form.formState.errors.currency?.message}
									>
										<SelectInput
											id="currency"
											value={field.value}
											onChange={field.onChange}
											options={currencyOptions}
											invalid={Boolean(form.formState.errors.currency)}
										/>
									</FormRow>
								)}
							/>

							<Controller
								control={form.control}
								name="is_default"
								render={({ field }) => (
									<SwitchRow
										label="Definir como carteira padrão"
										description="Recebe transferências e Pix quando nenhuma carteira é informada."
										checked={field.value}
										onChange={field.onChange}
									/>
								)}
							/>

							<div className="flex justify-end gap-2">
								<ButtonLink variant="ghost" to="/carteiras">
									Cancelar
								</ButtonLink>
								<Button type="submit" disabled={createWallet.isPending}>
									{createWallet.isPending ? <Spinner /> : null}
									Criar carteira
								</Button>
							</div>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
