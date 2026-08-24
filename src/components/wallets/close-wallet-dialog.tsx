import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useCloseWallet } from "@/api/queries/wallets";
import type { Wallet } from "@/api/schemas/wallet";
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

export function CloseWalletDialog({ wallet }: { wallet: Wallet }) {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const closeWallet = useCloseWallet();

	async function confirm() {
		try {
			await closeWallet.mutateAsync(wallet.id);
			toast.success("Carteira encerrada.");
			setOpen(false);
			await navigate({ to: "/carteiras" });
		} catch (error) {
			toast.error(describeError(error));
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
				Encerrar
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Encerrar “{wallet.alias}”?</AlertDialogTitle>
					<AlertDialogDescription>
						O encerramento exige saldo zerado e nenhuma transação pendente. A
						carteira padrão não pode ser encerrada.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction onClick={confirm} disabled={closeWallet.isPending}>
						Encerrar carteira
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
