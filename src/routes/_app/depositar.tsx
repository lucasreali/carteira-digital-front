import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { usePaymentMethods } from "@/api/queries/payment-methods";
import { useDeposit } from "@/api/queries/transactions";
import { type DepositForm, depositFormSchema } from "@/api/schemas/transaction";
import { PageHeader } from "@/components/common/page-header";
import { FormRow, MoneyInput, SelectInput } from "@/components/form/fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { WalletSelect } from "@/components/wallets/wallet-select";
import { reportApiError } from "@/lib/form";
import { depositMethodLabels, optionsFrom } from "@/lib/labels";

export const Route = createFileRoute("/_app/depositar")({
	component: DepositScreen,
});

type DepositPayload = z.output<typeof depositFormSchema>;

const methodOptions = optionsFrom(depositMethodLabels);

function DepositScreen() {
	const navigate = useNavigate();
	const deposit = useDeposit();
	const cards = usePaymentMethods({ type: "card" });

	const form = useForm<DepositForm, unknown, DepositPayload>({
		resolver: zodResolver(depositFormSchema),
		defaultValues: {
			wallet_id: "",
			amount: "",
			method: "pix",
			payment_method_id: "",
			description: "",
		},
	});

	const { errors } = form.formState;
	const method = form.watch("method");

	const cardOptions = (cards.data?.data ?? []).map((paymentMethod) => ({
		value: paymentMethod.id,
		label: `${paymentMethod.card?.brand?.toUpperCase() ?? "Cartão"} •••• ${paymentMethod.card?.last4 ?? ""}`,
	}));

	const submit = form.handleSubmit(async (values) => {
		try {
			const created = await deposit.mutateAsync({
				walletId: values.wallet_id,
				body: {
					amount: values.amount,
					method: values.method,
					payment_method_id: values.payment_method_id || undefined,
					description: values.description,
				},
			});
			toast.success("Depósito criado. Aguardando confirmação do provedor.");
			await navigate({
				to: "/transacoes/$transactionId",
				params: { transactionId: created.id },
			});
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["amount", "payment_method_id"],
			});
		}
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="Depositar"
				description="O crédito só é confirmado quando o provedor notifica o webhook."
			/>

			<Card className="max-w-2xl">
				<CardContent className="pt-6">
					<form onSubmit={submit} noValidate>
						<FieldGroup>
							<Controller
								control={form.control}
								name="wallet_id"
								render={({ field }) => (
									<FormRow
										label="Carteira de destino"
										htmlFor="wallet"
										error={errors.wallet_id?.message}
									>
										<WalletSelect
											id="wallet"
											value={field.value}
											onChange={field.onChange}
											invalid={Boolean(errors.wallet_id)}
										/>
									</FormRow>
								)}
							/>

							<Controller
								control={form.control}
								name="method"
								render={({ field }) => (
									<FormRow
										label="Forma de entrada"
										htmlFor="method"
										error={errors.method?.message}
									>
										<SelectInput
											id="method"
											value={field.value}
											onChange={field.onChange}
											options={methodOptions}
										/>
									</FormRow>
								)}
							/>

							{method === "card" ? (
								<Controller
									control={form.control}
									name="payment_method_id"
									render={({ field }) => (
										<FormRow
											label="Cartão"
											htmlFor="card"
											error={errors.payment_method_id?.message}
											description="Somente cartões já tokenizados pelo SDK do adquirente."
										>
											<SelectInput
												id="card"
												value={field.value ?? ""}
												onChange={field.onChange}
												options={cardOptions}
												invalid={Boolean(errors.payment_method_id)}
												placeholder={
													cardOptions.length === 0
														? "Nenhum cartão vinculado"
														: "Selecione o cartão"
												}
											/>
										</FormRow>
									)}
								/>
							) : null}

							<Controller
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormRow
										label="Valor"
										htmlFor="amount"
										error={errors.amount?.message}
										description="Valor mínimo de R$ 1,00."
									>
										<MoneyInput
											id="amount"
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
											invalid={Boolean(errors.amount)}
										/>
									</FormRow>
								)}
							/>

							<FormRow
								label="Descrição"
								htmlFor="description"
								error={errors.description?.message}
							>
								<Textarea
									id="description"
									rows={2}
									maxLength={140}
									placeholder="Recarga da carteira"
									className="text-sm"
									{...form.register("description")}
								/>
							</FormRow>

							{method === "pix" ? (
								<Alert>
									<AlertTitle>QR Code gerado após a confirmação</AlertTitle>
									<AlertDescription>
										Ao criar o depósito você recebe o código copia-e-cola e o QR
										Code na tela da transação.
									</AlertDescription>
								</Alert>
							) : null}

							<Button type="submit" size="lg" disabled={deposit.isPending}>
								{deposit.isPending ? <Spinner /> : null}
								Criar depósito
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
