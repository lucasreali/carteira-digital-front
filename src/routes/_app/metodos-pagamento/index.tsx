import { IconCreditCard, IconPlus } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

import { usePaymentMethods } from "@/api/queries/payment-methods";
import { ButtonLink } from "@/components/common/button-link";
import {
	EmptyState,
	ErrorState,
	LoadingRows,
} from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { PaymentMethodCard } from "@/components/payment-methods/payment-method-card";

export const Route = createFileRoute("/_app/metodos-pagamento/")({
	component: PaymentMethodsScreen,
});

function PaymentMethodsScreen() {
	const methods = usePaymentMethods();
	const items = methods.data?.data ?? [];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Métodos de pagamento"
				description="Contas bancárias para saque e cartões tokenizados para depósito."
				actions={
					<ButtonLink size="sm" to="/metodos-pagamento/novo">
						<IconPlus />
						Vincular método
					</ButtonLink>
				}
			/>

			{methods.isPending ? (
				<LoadingRows rows={2} />
			) : methods.isError ? (
				<ErrorState error={methods.error} onRetry={() => methods.refetch()} />
			) : items.length === 0 ? (
				<EmptyState
					icon={<IconCreditCard />}
					title="Nenhum método vinculado"
					description="Vincule uma conta bancária para sacar ou um cartão para depositar."
					action={
						<ButtonLink size="sm" to="/metodos-pagamento/novo">
							Vincular método
						</ButtonLink>
					}
				/>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{items.map((method) => (
						<PaymentMethodCard key={method.id} method={method} />
					))}
				</div>
			)}
		</div>
	);
}
