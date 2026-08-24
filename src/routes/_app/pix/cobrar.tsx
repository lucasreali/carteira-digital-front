import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft } from "@tabler/icons-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { useCreatePixCharge } from "@/api/queries/pix";
import {
	type CreatePixChargeForm,
	createPixChargeFormSchema,
} from "@/api/schemas/pix";
import { PageHeader } from "@/components/common/page-header";
import { FormRow, MoneyInput, SelectInput } from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { WalletSelect } from "@/components/wallets/wallet-select";
import { reportApiError } from "@/lib/form";

export const Route = createFileRoute("/_app/pix/cobrar")({
	component: NewPixChargeScreen,
});

type CreatePixChargePayload = z.output<typeof createPixChargeFormSchema>;

const expirationOptions = [
	{ value: "900", label: "15 minutos" },
	{ value: "1800", label: "30 minutos" },
	{ value: "3600", label: "1 hora" },
	{ value: "86400", label: "24 horas" },
];

function NewPixChargeScreen() {
	const navigate = useNavigate();
	const createCharge = useCreatePixCharge();

	const form = useForm<CreatePixChargeForm, unknown, CreatePixChargePayload>({
		resolver: zodResolver(createPixChargeFormSchema),
		defaultValues: {
			wallet_id: "",
			amount: "",
			expires_in: 3600,
			description: "",
		},
	});
	const { errors } = form.formState;

	const submit = form.handleSubmit(async (values) => {
		try {
			const charge = await createCharge.mutateAsync(values);
			toast.success("Cobrança criada.");
			await navigate({
				to: "/pix/cobrancas/$chargeId",
				params: { chargeId: charge.id },
			});
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["amount"],
			});
		}
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="Cobrar com Pix"
				description="Gere um QR Code com valor fixo ou deixe o pagador escolher o valor."
				actions={
					<Button variant="ghost" size="sm" render={<Link to="/pix" />}>
						<IconArrowLeft />
						Pix
					</Button>
				}
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
										label="Carteira que recebe"
										htmlFor="wallet"
										error={errors.wallet_id?.message}
									>
										<WalletSelect
											id="wallet"
											value={field.value}
											onChange={field.onChange}
											invalid={Boolean(errors.wallet_id)}
											withBalance={false}
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
										description="Deixe em branco para um QR sem valor definido."
									>
										<MoneyInput
											id="amount"
											value={field.value ?? ""}
											onChange={field.onChange}
											onBlur={field.onBlur}
											invalid={Boolean(errors.amount)}
										/>
									</FormRow>
								)}
							/>

							<Controller
								control={form.control}
								name="expires_in"
								render={({ field }) => (
									<FormRow
										label="Validade"
										htmlFor="expires_in"
										error={errors.expires_in?.message}
									>
										<SelectInput
											id="expires_in"
											value={String(field.value ?? 3600)}
											onChange={(value) => field.onChange(Number(value))}
											options={expirationOptions}
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
									placeholder="Pedido #1042"
									className="text-sm"
									{...form.register("description")}
								/>
							</FormRow>

							<Button type="submit" size="lg" disabled={createCharge.isPending}>
								{createCharge.isPending ? <Spinner /> : null}
								Gerar cobrança
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
