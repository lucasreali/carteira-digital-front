import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft } from "@tabler/icons-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreatePaymentMethod } from "@/api/queries/payment-methods";
import {
	type BankAccountForm,
	bankAccountFormSchema,
	type CardForm,
	cardFormSchema,
} from "@/api/schemas/payment-method";
import { ButtonLink } from "@/components/common/button-link";
import { PageHeader } from "@/components/common/page-header";
import { FormRow, SelectInput, SwitchRow } from "@/components/form/fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reportApiError } from "@/lib/form";
import { accountTypeLabels, optionsFrom } from "@/lib/labels";

export const Route = createFileRoute("/_app/metodos-pagamento/novo")({
	component: NewPaymentMethodScreen,
});

const accountTypeOptions = optionsFrom(accountTypeLabels);

function BankAccountFormCard() {
	const navigate = useNavigate();
	const createMethod = useCreatePaymentMethod();

	const form = useForm<BankAccountForm>({
		resolver: zodResolver(bankAccountFormSchema),
		defaultValues: {
			type: "bank_account",
			is_default: false,
			bank_code: "",
			agency: "",
			account_number: "",
			account_digit: "",
			account_type: "checking",
		},
	});
	const { errors } = form.formState;

	const submit = form.handleSubmit(async (values) => {
		try {
			await createMethod.mutateAsync({
				type: "bank_account",
				is_default: values.is_default,
				bank_account: {
					bank_code: values.bank_code,
					agency: values.agency,
					account_number: values.account_number,
					account_digit: values.account_digit,
					account_type: values.account_type,
				},
			});
			toast.success(
				"Conta vinculada. A verificação de titularidade foi iniciada.",
			);
			await navigate({ to: "/metodos-pagamento" });
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["bank_code", "agency", "account_number"],
			});
		}
	});

	return (
		<form onSubmit={submit} noValidate>
			<FieldGroup>
				<div className="grid gap-5 sm:grid-cols-2">
					<FormRow
						label="Código do banco"
						htmlFor="bank_code"
						error={errors.bank_code?.message}
						description="Três dígitos, como 341 ou 260."
					>
						<Input
							id="bank_code"
							inputMode="numeric"
							maxLength={3}
							placeholder="341"
							className="h-9 text-sm"
							aria-invalid={Boolean(errors.bank_code)}
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
							maxLength={5}
							placeholder="0001"
							className="h-9 text-sm"
							aria-invalid={Boolean(errors.agency)}
							{...form.register("agency")}
						/>
					</FormRow>
				</div>

				<div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
					<FormRow
						label="Número da conta"
						htmlFor="account_number"
						error={errors.account_number?.message}
					>
						<Input
							id="account_number"
							inputMode="numeric"
							maxLength={12}
							placeholder="123456"
							className="h-9 text-sm"
							aria-invalid={Boolean(errors.account_number)}
							{...form.register("account_number")}
						/>
					</FormRow>

					<FormRow
						label="Dígito"
						htmlFor="account_digit"
						error={errors.account_digit?.message}
					>
						<Input
							id="account_digit"
							maxLength={1}
							placeholder="6"
							className="h-9 text-sm"
							aria-invalid={Boolean(errors.account_digit)}
							{...form.register("account_digit")}
						/>
					</FormRow>
				</div>

				<Controller
					control={form.control}
					name="account_type"
					render={({ field }) => (
						<FormRow
							label="Tipo de conta"
							htmlFor="account_type"
							error={errors.account_type?.message}
						>
							<SelectInput
								id="account_type"
								value={field.value}
								onChange={field.onChange}
								options={accountTypeOptions}
							/>
						</FormRow>
					)}
				/>

				<Controller
					control={form.control}
					name="is_default"
					render={({ field }) => (
						<SwitchRow
							label="Definir como método padrão"
							checked={field.value}
							onChange={field.onChange}
						/>
					)}
				/>

				<Alert>
					<AlertTitle>Titularidade verificada</AlertTitle>
					<AlertDescription>
						A conta precisa pertencer ao mesmo CPF/CNPJ da carteira. A
						verificação pode levar alguns instantes.
					</AlertDescription>
				</Alert>

				<Button type="submit" size="lg" disabled={createMethod.isPending}>
					{createMethod.isPending ? <Spinner /> : null}
					Vincular conta
				</Button>
			</FieldGroup>
		</form>
	);
}

function CardFormCard() {
	const navigate = useNavigate();
	const createMethod = useCreatePaymentMethod();

	const form = useForm<CardForm>({
		resolver: zodResolver(cardFormSchema),
		defaultValues: { type: "card", is_default: false, card_token: "" },
	});
	const { errors } = form.formState;

	const submit = form.handleSubmit(async (values) => {
		try {
			await createMethod.mutateAsync({
				type: "card",
				is_default: values.is_default,
				card_token: values.card_token,
			});
			toast.success("Cartão vinculado.");
			await navigate({ to: "/metodos-pagamento" });
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["card_token"],
			});
		}
	});

	return (
		<form onSubmit={submit} noValidate>
			<FieldGroup>
				<Alert>
					<AlertTitle>O cartão nunca trafega em claro</AlertTitle>
					<AlertDescription>
						Envie apenas o token gerado pelo SDK do adquirente. Número, CVV e
						validade não passam por esta aplicação.
					</AlertDescription>
				</Alert>

				<FormRow
					label="Token do adquirente"
					htmlFor="card_token"
					error={errors.card_token?.message}
					description="Formato tok_live_… gerado no checkout."
				>
					<Input
						id="card_token"
						placeholder="tok_live_9f8e7d6c5b4a3210"
						className="h-9 font-mono text-sm"
						aria-invalid={Boolean(errors.card_token)}
						{...form.register("card_token")}
					/>
				</FormRow>

				<Controller
					control={form.control}
					name="is_default"
					render={({ field }) => (
						<SwitchRow
							label="Definir como método padrão"
							checked={field.value}
							onChange={field.onChange}
						/>
					)}
				/>

				<Button type="submit" size="lg" disabled={createMethod.isPending}>
					{createMethod.isPending ? <Spinner /> : null}
					Vincular cartão
				</Button>
			</FieldGroup>
		</form>
	);
}

function NewPaymentMethodScreen() {
	const [tab, setTab] = useState("bank_account");

	return (
		<div className="space-y-6">
			<PageHeader
				title="Vincular método de pagamento"
				description="Conta bancária para saques, cartão tokenizado para depósitos."
				actions={
					<ButtonLink variant="ghost" size="sm" to="/metodos-pagamento">
						<IconArrowLeft />
						Voltar
					</ButtonLink>
				}
			/>

			<Card className="max-w-2xl">
				<CardContent className="pt-6">
					<Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
						<TabsList className="w-full">
							<TabsTrigger value="bank_account">Conta bancária</TabsTrigger>
							<TabsTrigger value="card">Cartão</TabsTrigger>
						</TabsList>
						<TabsContent value="bank_account" className="pt-6">
							<BankAccountFormCard />
						</TabsContent>
						<TabsContent value="card" className="pt-6">
							<CardFormCard />
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
