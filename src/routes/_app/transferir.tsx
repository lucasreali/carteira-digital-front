import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { useTransfer } from "@/api/queries/transactions";
import {
	type TransferForm,
	transferFormSchema,
} from "@/api/schemas/transaction";
import { PageHeader } from "@/components/common/page-header";
import { FormRow, MoneyInput } from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { WalletSelect } from "@/components/wallets/wallet-select";
import { Document } from "@/domain/document";
import { reportApiError } from "@/lib/form";

export const Route = createFileRoute("/_app/transferir")({
	component: TransferScreen,
});

type TransferPayload = z.output<typeof transferFormSchema>;

function TransferScreen() {
	const navigate = useNavigate();
	const transfer = useTransfer();

	const form = useForm<TransferForm, unknown, TransferPayload>({
		resolver: zodResolver(transferFormSchema),
		defaultValues: {
			source_wallet_id: "",
			target: "wallet",
			destination_wallet_id: "",
			destination_email: "",
			destination_document: "",
			amount: "",
			description: "",
			scheduled_for: "",
		},
	});

	const { errors } = form.formState;
	const sourceWalletId = form.watch("source_wallet_id");

	const submit = form.handleSubmit(async (values) => {
		try {
			const created = await transfer.mutateAsync(values);
			toast.success(
				created.status === "completed"
					? "Transferência concluída."
					: "Transferência agendada com sucesso.",
			);
			await navigate({
				to: "/transacoes/$transactionId",
				params: { transactionId: created.id },
			});
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["amount", "destination_email", "destination_document"],
			});
		}
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="Transferir"
				description="Movimentação interna, atômica e imediata entre carteiras da plataforma."
			/>

			<Card className="max-w-2xl">
				<CardContent className="pt-6">
					<form onSubmit={submit} noValidate>
						<FieldGroup>
							<Controller
								control={form.control}
								name="source_wallet_id"
								render={({ field }) => (
									<FormRow
										label="Carteira de origem"
										htmlFor="source"
										error={errors.source_wallet_id?.message}
									>
										<WalletSelect
											id="source"
											value={field.value}
											onChange={field.onChange}
											invalid={Boolean(errors.source_wallet_id)}
										/>
									</FormRow>
								)}
							/>

							<Controller
								control={form.control}
								name="target"
								render={({ field }) => (
									<Tabs
										value={field.value}
										onValueChange={(value) => field.onChange(String(value))}
									>
										<TabsList className="w-full">
											<TabsTrigger value="wallet">Carteira</TabsTrigger>
											<TabsTrigger value="email">E-mail</TabsTrigger>
											<TabsTrigger value="document">CPF/CNPJ</TabsTrigger>
										</TabsList>

										<TabsContent value="wallet" className="pt-4">
											<Controller
												control={form.control}
												name="destination_wallet_id"
												render={({ field: destination }) => (
													<FormRow
														label="Carteira de destino"
														htmlFor="destination-wallet"
														error={errors.destination_wallet_id?.message}
													>
														<WalletSelect
															id="destination-wallet"
															value={destination.value ?? ""}
															onChange={destination.onChange}
															excludeWalletId={sourceWalletId}
															invalid={Boolean(errors.destination_wallet_id)}
															withBalance={false}
														/>
													</FormRow>
												)}
											/>
										</TabsContent>

										<TabsContent value="email" className="pt-4">
											<FormRow
												label="E-mail do destinatário"
												htmlFor="destination-email"
												error={errors.destination_email?.message}
											>
												<Input
													id="destination-email"
													type="email"
													placeholder="destinatario@exemplo.com"
													className="h-9 text-sm"
													aria-invalid={Boolean(errors.destination_email)}
													{...form.register("destination_email")}
												/>
											</FormRow>
										</TabsContent>

										<TabsContent value="document" className="pt-4">
											<Controller
												control={form.control}
												name="destination_document"
												render={({ field: document }) => (
													<FormRow
														label="CPF ou CNPJ do destinatário"
														htmlFor="destination-document"
														error={errors.destination_document?.message}
													>
														<Input
															id="destination-document"
															inputMode="numeric"
															placeholder="000.000.000-00"
															className="h-9 text-sm"
															aria-invalid={Boolean(
																errors.destination_document,
															)}
															value={document.value ?? ""}
															onBlur={document.onBlur}
															onChange={(event) =>
																document.onChange(
																	Document.maskInput(event.target.value),
																)
															}
														/>
													</FormRow>
												)}
											/>
										</TabsContent>
									</Tabs>
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
								description="Aparece no extrato das duas carteiras. Até 140 caracteres."
							>
								<Textarea
									id="description"
									rows={2}
									maxLength={140}
									placeholder="Aluguel agosto"
									className="text-sm"
									{...form.register("description")}
								/>
							</FormRow>

							<FormRow
								label="Agendar para"
								htmlFor="scheduled_for"
								error={errors.scheduled_for?.message}
								description="Opcional. Se preenchido, a transação nasce pendente e executa na data."
							>
								<Input
									id="scheduled_for"
									type="datetime-local"
									className="h-9 text-sm"
									{...form.register("scheduled_for")}
								/>
							</FormRow>

							<Button type="submit" size="lg" disabled={transfer.isPending}>
								{transfer.isPending ? <Spinner /> : null}
								Transferir
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
