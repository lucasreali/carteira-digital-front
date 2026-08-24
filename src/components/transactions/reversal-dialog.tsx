import { zodResolver } from "@hookform/resolvers/zod";
import { IconRotateClockwise } from "@tabler/icons-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useReversal } from "@/api/queries/transactions";
import type { Transaction } from "@/api/schemas/transaction";
import {
	type ReversalForm,
	reversalFormSchema,
} from "@/api/schemas/transaction";
import {
	FormRow,
	MoneyInput,
	SelectInput,
	SwitchRow,
} from "@/components/form/fields";
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
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Money } from "@/domain/money";
import { reportApiError } from "@/lib/form";
import { optionsFrom, reversalReasonLabels } from "@/lib/labels";

const reasonOptions = optionsFrom(reversalReasonLabels);

export function ReversalDialog({ transaction }: { transaction: Transaction }) {
	const [open, setOpen] = useState(false);
	const reverse = useReversal(transaction.id);

	const form = useForm<ReversalForm>({
		resolver: zodResolver(reversalFormSchema),
		defaultValues: { reason: "customer_request", partial: false, amount: "" },
	});
	const partial = form.watch("partial");

	const submit = form.handleSubmit(async (values) => {
		const amount = values.partial ? Money.parse(values.amount ?? "") : null;
		if (values.partial && !amount) {
			form.setError("amount", { message: "Informe o valor a estornar" });
			return;
		}
		if (amount && amount.toCents() > transaction.amount) {
			form.setError("amount", {
				message: "O estorno não pode exceder o valor original",
			});
			return;
		}

		try {
			await reverse.mutateAsync({
				reason: values.reason,
				amount: amount?.toCents(),
			});
			toast.success("Estorno criado com sucesso.");
			setOpen(false);
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["amount"],
			});
		}
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>
				<IconRotateClockwise />
				Estornar
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Estornar transação</DialogTitle>
					<DialogDescription>
						O estorno cria um lançamento compensatório — a transação original é
						preservada.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={submit} noValidate>
					<FieldGroup>
						<Controller
							control={form.control}
							name="reason"
							render={({ field }) => (
								<FormRow
									label="Motivo"
									htmlFor="reason"
									error={form.formState.errors.reason?.message}
								>
									<SelectInput
										id="reason"
										value={field.value}
										onChange={field.onChange}
										options={reasonOptions}
									/>
								</FormRow>
							)}
						/>

						<Controller
							control={form.control}
							name="partial"
							render={({ field }) => (
								<SwitchRow
									label="Estorno parcial"
									description={`Valor original: ${Money.fromCents(transaction.amount, transaction.currency).toString()}`}
									checked={field.value}
									onChange={field.onChange}
								/>
							)}
						/>

						{partial ? (
							<Controller
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormRow
										label="Valor a estornar"
										htmlFor="reversal-amount"
										error={form.formState.errors.amount?.message}
									>
										<MoneyInput
											id="reversal-amount"
											value={field.value ?? ""}
											onChange={field.onChange}
											onBlur={field.onBlur}
											invalid={Boolean(form.formState.errors.amount)}
										/>
									</FormRow>
								)}
							/>
						) : null}

						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={() => setOpen(false)}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={reverse.isPending}>
								{reverse.isPending ? <Spinner /> : null}
								Confirmar estorno
							</Button>
						</DialogFooter>
					</FieldGroup>
				</form>
			</DialogContent>
		</Dialog>
	);
}
