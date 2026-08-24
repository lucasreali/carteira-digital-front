import {
	IconBuildingBank,
	IconCreditCard,
	IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

import {
	useRemovePaymentMethod,
	useUpdatePaymentMethod,
} from "@/api/queries/payment-methods";
import type { PaymentMethod } from "@/api/schemas/payment-method";
import { StatusBadge } from "@/components/common/status-badge";
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
import { Button } from "@/components/ui/button";
import { describeError } from "@/lib/form";
import { formatDate } from "@/lib/format";
import { accountTypeLabels, paymentMethodStatusLabels } from "@/lib/labels";

function describeMethod(method: PaymentMethod) {
	if (method.bank_account) {
		return {
			title: method.bank_account.bank_name,
			subtitle: `Ag ${method.bank_account.agency} · Conta ${method.bank_account.account_masked} · ${accountTypeLabels[method.bank_account.account_type]}`,
			extra: `Titular ${method.bank_account.holder_document_masked}`,
		};
	}
	if (method.card) {
		return {
			title: `${method.card.brand.toUpperCase()} •••• ${method.card.last4}`,
			subtitle: `Validade ${String(method.card.exp_month).padStart(2, "0")}/${method.card.exp_year}`,
			extra: method.card.holder_name,
		};
	}
	return { title: "Método de pagamento", subtitle: method.id, extra: null };
}

export function PaymentMethodCard({ method }: { method: PaymentMethod }) {
	const updateMethod = useUpdatePaymentMethod();
	const removeMethod = useRemovePaymentMethod();
	const described = describeMethod(method);

	async function makeDefault() {
		try {
			await updateMethod.mutateAsync({
				paymentMethodId: method.id,
				body: { is_default: true },
			});
			toast.success("Método definido como padrão.");
		} catch (error) {
			toast.error(describeError(error));
		}
	}

	async function remove() {
		try {
			await removeMethod.mutateAsync(method.id);
			toast.success("Método removido.");
		} catch (error) {
			toast.error(describeError(error));
		}
	}

	return (
		<article className="flex flex-col gap-4 border border-border/60 bg-card p-5">
			<div className="flex items-start gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center bg-muted text-muted-foreground">
					{method.type === "card" ? (
						<IconCreditCard className="size-5" />
					) : (
						<IconBuildingBank className="size-5" />
					)}
				</span>
				<div className="min-w-0 flex-1 space-y-0.5">
					<p className="truncate font-medium text-sm">{described.title}</p>
					<p className="truncate text-muted-foreground text-xs">
						{described.subtitle}
					</p>
					{described.extra ? (
						<p className="truncate text-muted-foreground text-xs">
							{described.extra}
						</p>
					) : null}
				</div>
				<StatusBadge
					status={method.status}
					label={paymentMethodStatusLabels[method.status]}
				/>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2 border-border/60 border-t pt-3">
				<p className="text-muted-foreground text-xs">
					{method.is_default ? "Método padrão · " : ""}
					vinculado em {formatDate(method.created_at)}
				</p>
				<div className="flex items-center gap-1">
					{method.is_default ? null : (
						<Button
							variant="ghost"
							size="sm"
							onClick={makeDefault}
							disabled={updateMethod.isPending}
						>
							Tornar padrão
						</Button>
					)}
					<AlertDialog>
						<AlertDialogTrigger
							render={
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Remover método"
								/>
							}
						>
							<IconTrash />
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Remover método de pagamento?
								</AlertDialogTitle>
								<AlertDialogDescription>
									A remoção é bloqueada se houver transação em andamento
									vinculada a este método.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>
								<AlertDialogAction
									onClick={remove}
									disabled={removeMethod.isPending}
								>
									Remover
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</article>
	);
}
