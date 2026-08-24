import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft, IconUpload } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useKyc, useSubmitKyc } from "@/api/queries/users";
import {
	type KycSubmissionForm,
	kycSubmissionFormSchema,
} from "@/api/schemas/user";
import { ButtonLink } from "@/components/common/button-link";
import { ErrorState, LoadingRows } from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { FormRow, SelectInput } from "@/components/form/fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Money } from "@/domain/money";
import { reportApiError } from "@/lib/form";
import { formatDateTime } from "@/lib/format";
import {
	kycDocumentTypeLabels,
	kycStatusLabels,
	optionsFrom,
} from "@/lib/labels";

export const Route = createFileRoute("/_app/perfil/kyc")({
	component: KycScreen,
});

const documentTypeOptions = optionsFrom(kycDocumentTypeLabels);
const MAX_LEVEL = 2;

function FileField({
	id,
	label,
	description,
	error,
	onSelect,
	file,
}: {
	id: string;
	label: string;
	description?: string;
	error?: string;
	onSelect: (file: File | undefined) => void;
	file?: File;
}) {
	return (
		<FormRow
			label={label}
			htmlFor={id}
			error={error}
			description={
				file
					? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`
					: description
			}
		>
			<Input
				id={id}
				type="file"
				accept="image/png,image/jpeg,application/pdf"
				className="h-9 py-1.5 text-sm"
				aria-invalid={Boolean(error)}
				onChange={(event) => onSelect(event.target.files?.[0])}
			/>
		</FormRow>
	);
}

function KycScreen() {
	const kyc = useKyc();
	const submitKyc = useSubmitKyc();

	const form = useForm<KycSubmissionForm>({
		resolver: zodResolver(kycSubmissionFormSchema),
		defaultValues: { document_type: "cnh" },
	});
	const { errors } = form.formState;

	const submit = form.handleSubmit(async (values) => {
		const payload = new FormData();
		payload.set("document_type", values.document_type);
		payload.set("document_front", values.document_front);
		payload.set("selfie", values.selfie);
		if (values.document_back)
			payload.set("document_back", values.document_back);

		try {
			await submitKyc.mutateAsync(payload);
			toast.success("Documentos enviados. A análise começou.");
			form.reset({ document_type: values.document_type });
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["document_front", "document_back", "selfie"],
			});
		}
	});

	if (kyc.isPending) return <LoadingRows rows={3} />;
	if (kyc.isError)
		return <ErrorState error={kyc.error} onRetry={() => kyc.refetch()} />;

	const data = kyc.data;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Verificação de identidade"
				description="O nível do KYC define os limites diários e noturnos da conta."
				actions={
					<ButtonLink variant="ghost" size="sm" to="/perfil">
						<IconArrowLeft />
						Perfil
					</ButtonLink>
				}
			/>

			<Card>
				<CardHeader>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<CardTitle>Status atual</CardTitle>
							<CardDescription>
								Nível {data.level} de {MAX_LEVEL}
							</CardDescription>
						</div>
						<StatusBadge
							status={data.status}
							label={kycStatusLabels[data.status]}
						/>
					</div>
				</CardHeader>
				<CardContent className="space-y-5">
					<Progress value={(data.level / MAX_LEVEL) * 100} />

					<dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
						<div>
							<dt className="text-muted-foreground text-xs">Enviado em</dt>
							<dd>{formatDateTime(data.submitted_at)}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs">Analisado em</dt>
							<dd>{formatDateTime(data.reviewed_at)}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs">Limite diário</dt>
							<dd className="numeric tabular-nums">
								{Money.fromCents(data.limits.daily_transfer_limit).toString()}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs">Limite noturno</dt>
							<dd className="numeric tabular-nums">
								{Money.fromCents(data.limits.nightly_transfer_limit).toString()}
							</dd>
						</div>
					</dl>

					{data.rejection_reason ? (
						<Alert>
							<AlertTitle>Motivo da recusa</AlertTitle>
							<AlertDescription>{data.rejection_reason}</AlertDescription>
						</Alert>
					) : null}
				</CardContent>
			</Card>

			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>Enviar documentos</CardTitle>
					<CardDescription>
						Arquivos de até 10 MB em PNG, JPEG ou PDF. Uma análise por vez.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{data.status === "in_review" ? (
						<Alert>
							<AlertTitle>Análise em andamento</AlertTitle>
							<AlertDescription>
								Aguarde o resultado da verificação atual antes de enviar novos
								documentos.
							</AlertDescription>
						</Alert>
					) : (
						<form onSubmit={submit} noValidate>
							<FieldGroup>
								<Controller
									control={form.control}
									name="document_type"
									render={({ field }) => (
										<FormRow
											label="Tipo de documento"
											htmlFor="document_type"
											error={errors.document_type?.message}
										>
											<SelectInput
												id="document_type"
												value={field.value}
												onChange={field.onChange}
												options={documentTypeOptions}
											/>
										</FormRow>
									)}
								/>

								<Controller
									control={form.control}
									name="document_front"
									render={({ field }) => (
										<FileField
											id="document_front"
											label="Frente do documento"
											description="Foto nítida, sem reflexos e com todos os cantos visíveis."
											error={errors.document_front?.message}
											file={field.value}
											onSelect={field.onChange}
										/>
									)}
								/>

								<Controller
									control={form.control}
									name="document_back"
									render={({ field }) => (
										<FileField
											id="document_back"
											label="Verso do documento (opcional)"
											description="Obrigatório para RG e CNH em papel."
											error={errors.document_back?.message}
											file={field.value}
											onSelect={field.onChange}
										/>
									)}
								/>

								<Controller
									control={form.control}
									name="selfie"
									render={({ field }) => (
										<FileField
											id="selfie"
											label="Selfie"
											description="Rosto centralizado, sem óculos escuros ou boné."
											error={errors.selfie?.message}
											file={field.value}
											onSelect={field.onChange}
										/>
									)}
								/>

								<Button type="submit" size="lg" disabled={submitKyc.isPending}>
									{submitKyc.isPending ? <Spinner /> : <IconUpload />}
									Enviar para análise
								</Button>
							</FieldGroup>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
