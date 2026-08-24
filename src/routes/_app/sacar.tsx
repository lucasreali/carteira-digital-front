import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { usePaymentMethods } from "@/api/queries/payment-methods";
import { useWithdrawal } from "@/api/queries/transactions";
import {
	type WithdrawalForm,
	withdrawalFormSchema,
} from "@/api/schemas/transaction";
import { PageHeader } from "@/components/common/page-header";
import { FormRow, MoneyInput, SelectInput } from "@/components/form/fields";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { WalletSelect } from "@/components/wallets/wallet-select";
import { reportApiError } from "@/lib/form";

export const Route = createFileRoute("/_app/sacar")({
	component: WithdrawalScreen,
});

type WithdrawalPayload = z.output<typeof withdrawalFormSchema>;

function WithdrawalScreen() {
	const navigate = useNavigate();
	const withdraw = useWithdrawal();
	const accounts = usePaymentMethods({ type: "bank_account" });

	const form = useForm<WithdrawalForm, unknown, WithdrawalPayload>({
		resolver: zodResolver(withdrawalFormSchema),
		defaultValues: {
			wallet_id: "",
			amount: "",
			payment_method_id: "",
			description: "",
		},
	});

	const { errors } = form.formState;
	const verifiedAccounts = (accounts.data?.data ?? []).filter(
		(account) => account.status === "verified",
	);
	const accountOptions = verifiedAccounts.map((account) => ({
		value: account.id,
		label: `${account.bank_account?.bank_name ?? "Banco"} · ag ${account.bank_account?.agency} · ${account.bank_account?.account_masked}`,
	}));

	const submit = form.handleSubmit(async (values) => {
		try {
			const created = await withdraw.mutateAsync({
				walletId: values.wallet_id,
				body: {
					amount: values.amount,
					payment_method_id: values.payment_method_id,
					description: values.description,
				},
			});
			toast.success("Saque em processamento.");
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
				title="Sacar"
				description="O valor é debitado e bloqueado na hora; a liquidação bancária é assíncrona."
			/>

			{!accounts.isPending && verifiedAccounts.length === 0 ? (
				<Alert>
					<AlertTitle>Nenhuma conta bancária verificada</AlertTitle>
					<AlertDescription>
						Vincule e verifique uma conta bancária antes de solicitar um saque.
					</AlertDescription>
					<AlertAction>
						<Button
							size="sm"
							variant="outline"
							render={<Link to="/metodos-pagamento" />}
						>
							Vincular conta
						</Button>
					</AlertAction>
				</Alert>
			) : null}

			<Card className="max-w-2xl">
				<CardContent className="pt-6">
					<form onSubmit={submit} noValidate>
						<FieldGroup>
							<Controller
								control={form.control}
								name="wallet_id"
								render={({ field }) => (
									<FormRow
										label="Carteira de origem"
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
								name="payment_method_id"
								render={({ field }) => (
									<FormRow
										label="Conta de destino"
										htmlFor="account"
										error={errors.payment_method_id?.message}
									>
										<SelectInput
											id="account"
											value={field.value}
											onChange={field.onChange}
											options={accountOptions}
											invalid={Boolean(errors.payment_method_id)}
											placeholder={
												accountOptions.length === 0
													? "Nenhuma conta verificada"
													: "Selecione a conta"
											}
										/>
									</FormRow>
								)}
							/>

							<Controller
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormRow
										label="Valor"
										htmlFor="amount"
										error={errors.amount?.message}
										description="Uma tarifa de saque pode ser aplicada pela instituição."
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
									placeholder="Saque para conta Itaú"
									className="text-sm"
									{...form.register("description")}
								/>
							</FormRow>

							<Button type="submit" size="lg" disabled={withdraw.isPending}>
								{withdraw.isPending ? <Spinner /> : null}
								Solicitar saque
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
