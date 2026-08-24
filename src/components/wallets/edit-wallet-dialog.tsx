import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUpdateWallet } from "@/api/queries/wallets";
import type { Wallet } from "@/api/schemas/wallet";
import {
	type UpdateWalletForm,
	updateWalletFormSchema,
} from "@/api/schemas/wallet";
import { FormRow, SelectInput, SwitchRow } from "@/components/form/fields";
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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { reportApiError } from "@/lib/form";

const statusOptions = [
	{ value: "active", label: "Ativa" },
	{ value: "frozen", label: "Congelada" },
];

export function EditWalletDialog({ wallet }: { wallet: Wallet }) {
	const [open, setOpen] = useState(false);
	const updateWallet = useUpdateWallet(wallet.id);

	const form = useForm<UpdateWalletForm>({
		resolver: zodResolver(updateWalletFormSchema),
		values: {
			alias: wallet.alias,
			is_default: wallet.is_default,
			status: wallet.status === "frozen" ? "frozen" : "active",
		},
	});

	const submit = form.handleSubmit(async (values) => {
		try {
			await updateWallet.mutateAsync({ body: values, version: wallet.version });
			toast.success("Carteira atualizada.");
			setOpen(false);
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["alias", "status"],
			});
		}
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>
				Editar
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar carteira</DialogTitle>
					<DialogDescription>
						Apelido, padrão e status são editáveis. O saldo nunca é alterado por
						aqui.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={submit} noValidate>
					<FieldGroup>
						<FormRow
							label="Apelido"
							htmlFor="wallet-alias"
							error={form.formState.errors.alias?.message}
						>
							<Input
								id="wallet-alias"
								maxLength={40}
								className="h-9 text-sm"
								aria-invalid={Boolean(form.formState.errors.alias)}
								{...form.register("alias")}
							/>
						</FormRow>

						<Controller
							control={form.control}
							name="status"
							render={({ field }) => (
								<FormRow
									label="Status"
									htmlFor="wallet-status"
									error={form.formState.errors.status?.message}
									description="Congelar bloqueia novas movimentações sem encerrar a carteira."
								>
									<SelectInput
										id="wallet-status"
										value={field.value}
										onChange={field.onChange}
										options={statusOptions}
									/>
								</FormRow>
							)}
						/>

						<Controller
							control={form.control}
							name="is_default"
							render={({ field }) => (
								<SwitchRow
									label="Carteira padrão"
									description="Destino das entradas quando nenhuma carteira é informada."
									checked={field.value}
									onChange={field.onChange}
									disabled={wallet.is_default}
								/>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={() => setOpen(false)}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={updateWallet.isPending}>
								{updateWallet.isPending ? <Spinner /> : null}
								Salvar
							</Button>
						</DialogFooter>
					</FieldGroup>
				</form>
			</DialogContent>
		</Dialog>
	);
}
