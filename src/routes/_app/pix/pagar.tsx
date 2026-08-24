import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft } from "@tabler/icons-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { usePixPayment } from "@/api/queries/pix";
import { type PixPaymentForm, pixPaymentFormSchema } from "@/api/schemas/pix";
import { ButtonLink } from "@/components/common/button-link";
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
import { reportApiError } from "@/lib/form";

export const Route = createFileRoute("/_app/pix/pagar")({
	component: PixPaymentScreen,
});

type PixPaymentPayload = z.output<typeof pixPaymentFormSchema>;

function PixPaymentScreen() {
	const navigate = useNavigate();
	const pay = usePixPayment();

	const form = useForm<PixPaymentForm, unknown, PixPaymentPayload>({
		resolver: zodResolver(pixPaymentFormSchema),
		defaultValues: {
			source_wallet_id: "",
			mode: "key",
			pix_key: "",
			qr_code: "",
			amount: "",
			description: "",
		},
	});
	const { errors } = form.formState;

	const submit = form.handleSubmit(async (values) => {
		try {
			const created = await pay.mutateAsync(values);
			toast.success("Pix enviado com sucesso.");
			await navigate({
				to: "/transacoes/$transactionId",
				params: { transactionId: created.id },
			});
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["pix_key", "qr_code", "amount"],
			});
		}
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="Pagar com Pix"
				description="Informe a chave ou cole o código copia-e-cola — nunca os dois juntos."
				actions={
					<ButtonLink variant="ghost" size="sm" to="/pix">
						<IconArrowLeft />
						Pix
					</ButtonLink>
				}
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
								name="mode"
								render={({ field }) => (
									<Tabs
										value={field.value}
										onValueChange={(value) => field.onChange(String(value))}
									>
										<TabsList className="w-full">
											<TabsTrigger value="key">Chave Pix</TabsTrigger>
											<TabsTrigger value="qr_code">Copia-e-cola</TabsTrigger>
										</TabsList>

										<TabsContent value="key" className="space-y-5 pt-4">
											<FormRow
												label="Chave do destinatário"
												htmlFor="pix_key"
												error={errors.pix_key?.message}
												description="CPF, CNPJ, e-mail, telefone ou chave aleatória."
											>
												<Input
													id="pix_key"
													placeholder="bruno.lima@example.com"
													className="h-9 text-sm"
													aria-invalid={Boolean(errors.pix_key)}
													{...form.register("pix_key")}
												/>
											</FormRow>

											<Controller
												control={form.control}
												name="amount"
												render={({ field: amount }) => (
													<FormRow
														label="Valor"
														htmlFor="amount"
														error={errors.amount?.message}
													>
														<MoneyInput
															id="amount"
															value={amount.value ?? ""}
															onChange={amount.onChange}
															onBlur={amount.onBlur}
															invalid={Boolean(errors.amount)}
														/>
													</FormRow>
												)}
											/>
										</TabsContent>

										<TabsContent value="qr_code" className="space-y-5 pt-4">
											<FormRow
												label="Código copia-e-cola"
												htmlFor="qr_code"
												error={errors.qr_code?.message}
												description="Cole o payload EMV completo. O valor vem do próprio QR quando ele é fixo."
											>
												<Textarea
													id="qr_code"
													rows={4}
													placeholder="00020126580014BR.GOV.BCB.PIX…"
													className="font-mono text-xs"
													aria-invalid={Boolean(errors.qr_code)}
													{...form.register("qr_code")}
												/>
											</FormRow>

											<Controller
												control={form.control}
												name="amount"
												render={({ field: amount }) => (
													<FormRow
														label="Valor (opcional)"
														htmlFor="qr-amount"
														error={errors.amount?.message}
														description="Preencha apenas para QR sem valor definido."
													>
														<MoneyInput
															id="qr-amount"
															value={amount.value ?? ""}
															onChange={amount.onChange}
															onBlur={amount.onBlur}
															invalid={Boolean(errors.amount)}
														/>
													</FormRow>
												)}
											/>
										</TabsContent>
									</Tabs>
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
									placeholder="Pedido #1042"
									className="text-sm"
									{...form.register("description")}
								/>
							</FormRow>

							<Button type="submit" size="lg" disabled={pay.isPending}>
								{pay.isPending ? <Spinner /> : null}
								Pagar
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
