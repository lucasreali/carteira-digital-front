import { zodResolver } from "@hookform/resolvers/zod";
import { IconTrash, IconWebhook } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
	useCreateWebhook,
	useRemoveWebhook,
	useWebhooks,
} from "@/api/queries/webhooks";
import {
	type CreateWebhookForm,
	createWebhookFormSchema,
	type WebhookEvent,
} from "@/api/schemas/webhook";
import { CopyButton } from "@/components/common/copy-button";
import {
	EmptyState,
	ErrorState,
	LoadingRows,
} from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { FormRow } from "@/components/form/fields";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { describeError, reportApiError } from "@/lib/form";
import { formatDate } from "@/lib/format";
import { webhookEventLabels } from "@/lib/labels";

export const Route = createFileRoute("/_app/webhooks")({
	component: WebhooksScreen,
});

const eventEntries = Object.entries(webhookEventLabels) as Array<
	[WebhookEvent, string]
>;

function WebhooksScreen() {
	const webhooks = useWebhooks();
	const createWebhook = useCreateWebhook();
	const removeWebhook = useRemoveWebhook();
	const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

	const form = useForm<CreateWebhookForm>({
		resolver: zodResolver(createWebhookFormSchema),
		defaultValues: { url: "", events: [] },
	});
	const { errors } = form.formState;

	const submit = form.handleSubmit(async (values) => {
		try {
			const created = await createWebhook.mutateAsync(values);
			setRevealedSecret(created.secret);
			form.reset({ url: "", events: [] });
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["url", "events"],
			});
		}
	});

	async function remove(webhookId: string) {
		try {
			await removeWebhook.mutateAsync(webhookId);
			toast.success("Assinatura removida.");
		} catch (error) {
			toast.error(describeError(error));
		}
	}

	const items = webhooks.data?.data ?? [];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Webhooks"
				description="Receba eventos assíncronos assinados com HMAC SHA-256 no header X-Wallet-Signature."
			/>

			<div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
				<Card>
					<CardHeader>
						<CardTitle>Assinaturas ativas</CardTitle>
					</CardHeader>
					<CardContent>
						{webhooks.isPending ? (
							<LoadingRows rows={2} />
						) : webhooks.isError ? (
							<ErrorState
								error={webhooks.error}
								onRetry={() => webhooks.refetch()}
							/>
						) : items.length === 0 ? (
							<EmptyState
								icon={<IconWebhook />}
								title="Nenhuma assinatura"
								description="Cadastre uma URL HTTPS para receber os eventos da carteira."
							/>
						) : (
							<ul className="divide-y divide-border/60">
								{items.map((webhook) => (
									<li
										key={webhook.id}
										className="space-y-2 py-4 first:pt-0 last:pb-0"
									>
										<div className="flex items-start gap-3">
											<div className="min-w-0 flex-1 space-y-1">
												<p className="truncate font-medium text-sm">
													{webhook.url}
												</p>
												<p className="text-muted-foreground text-xs">
													{webhook.secret_masked} · criada em{" "}
													{formatDate(webhook.created_at)}
												</p>
											</div>
											<StatusBadge
												status={webhook.status}
												label={
													webhook.status === "active" ? "Ativa" : "Desabilitada"
												}
											/>
											<AlertDialog>
												<AlertDialogTrigger
													render={
														<Button
															variant="ghost"
															size="icon-sm"
															aria-label="Remover assinatura"
														/>
													}
												>
													<IconTrash />
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Remover assinatura?
														</AlertDialogTitle>
														<AlertDialogDescription>
															Seu endpoint deixa de receber os eventos
															imediatamente.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancelar</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => remove(webhook.id)}
														>
															Remover
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
										<div className="flex flex-wrap gap-1.5">
											{webhook.events.map((event) => (
												<Badge
													key={event}
													variant="outline"
													className="font-mono"
												>
													{event}
												</Badge>
											))}
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card className="h-fit">
					<CardHeader>
						<CardTitle>Nova assinatura</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={submit} noValidate>
							<FieldGroup>
								<FormRow
									label="URL de destino"
									htmlFor="url"
									error={errors.url?.message}
									description="Precisa usar HTTPS. Retry com backoff: 1m, 5m, 30m, 2h, 12h."
								>
									<Input
										id="url"
										placeholder="https://meuapp.example.com/hooks/wallet"
										className="h-9 text-sm"
										aria-invalid={Boolean(errors.url)}
										{...form.register("url")}
									/>
								</FormRow>

								<Controller
									control={form.control}
									name="events"
									render={({ field }) => (
										<FieldSet>
											<FieldLegend variant="label">Eventos</FieldLegend>
											<div className="space-y-2.5">
												{eventEntries.map(([event, label]) => (
													<Field key={event} orientation="horizontal">
														<Checkbox
															id={event}
															checked={field.value.includes(event)}
															onCheckedChange={(checked) =>
																field.onChange(
																	checked
																		? [...field.value, event]
																		: field.value.filter(
																				(current) => current !== event,
																			),
																)
															}
														/>
														<FieldLabel
															htmlFor={event}
															className="font-normal text-sm"
														>
															{label}
														</FieldLabel>
													</Field>
												))}
											</div>
											<FieldError>{errors.events?.message}</FieldError>
										</FieldSet>
									)}
								/>

								<Button type="submit" disabled={createWebhook.isPending}>
									{createWebhook.isPending ? <Spinner /> : null}
									Criar assinatura
								</Button>
							</FieldGroup>
						</form>
					</CardContent>
				</Card>
			</div>

			<Dialog
				open={revealedSecret !== null}
				onOpenChange={() => setRevealedSecret(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Guarde o secret agora</DialogTitle>
						<DialogDescription>
							Ele é exibido uma única vez. Use-o para validar a assinatura de
							cada entrega.
						</DialogDescription>
					</DialogHeader>
					<p className="break-all border border-border/60 bg-muted/40 p-3 font-mono text-xs">
						{revealedSecret}
					</p>
					<DialogFooter>
						<CopyButton value={revealedSecret ?? ""} label="Copiar secret" />
						<Button onClick={() => setRevealedSecret(null)}>Já salvei</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
