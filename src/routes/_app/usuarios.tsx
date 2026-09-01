import { zodResolver } from "@hookform/resolvers/zod";
import { IconCloudDataConnection, IconSearch } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
	useFindFunctionUser,
	useFunctionUserIds,
} from "@/api/queries/function-users";
import {
	type FindFunctionUserForm,
	findFunctionUserFormSchema,
} from "@/api/schemas/function-user";
import { EmptyState } from "@/components/common/data-state";
import { PageHeader } from "@/components/common/page-header";
import { FormRow } from "@/components/form/fields";
import { FunctionCallLogCard } from "@/components/function-users/function-call-log-card";
import { FunctionUserCard } from "@/components/function-users/function-user-card";
import { CreateFunctionUserDialog } from "@/components/function-users/function-user-dialogs";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { reportApiError } from "@/lib/form";

export const Route = createFileRoute("/_app/usuarios")({
	component: FunctionUsersScreen,
});

function FindUserCard() {
	const findUser = useFindFunctionUser();

	const form = useForm<FindFunctionUserForm>({
		resolver: zodResolver(findFunctionUserFormSchema),
		defaultValues: { id: "" },
	});

	const submit = form.handleSubmit(async (values) => {
		try {
			const user = await findUser.mutateAsync(values.id);
			toast.success(`Usuário ${user.nome} carregado.`);
			form.reset();
		} catch (error) {
			reportApiError(error, { setError: form.setError, knownFields: ["id"] });
		}
	});

	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<IconSearch className="size-4 text-primary" />
					Consultar por ID
				</CardTitle>
				<CardDescription>
					GET /users/{"{id}"} busca o documento pelo ObjectId e o adiciona à
					lista.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={submit} noValidate className="space-y-3">
					<FormRow
						label="ObjectId"
						htmlFor="find-user-id"
						error={form.formState.errors.id?.message}
					>
						<Input
							id="find-user-id"
							placeholder="507f1f77bcf86cd799439011"
							className="h-9 font-mono text-sm"
							aria-invalid={Boolean(form.formState.errors.id)}
							{...form.register("id")}
						/>
					</FormRow>
					<Button
						type="submit"
						size="sm"
						className="w-full"
						disabled={findUser.isPending}
					>
						{findUser.isPending ? <Spinner /> : null}
						Consultar
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function FunctionUsersScreen() {
	const userIds = useFunctionUserIds();

	return (
		<div className="space-y-6">
			<PageHeader
				title="Usuários (Azure Functions)"
				description="CRUD servido por Azure Functions sobre o MongoDB Atlas, separado da API da carteira. Como o contrato não expõe listagem, os ObjectId criados ou consultados neste navegador ficam salvos localmente."
				actions={<CreateFunctionUserDialog />}
			/>

			<div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
				<section className="space-y-3">
					{userIds.length === 0 ? (
						<EmptyState
							icon={<IconCloudDataConnection />}
							title="Nenhum usuário nesta lista"
							description="Crie um usuário ou consulte um ObjectId existente para começar."
							action={<CreateFunctionUserDialog />}
						/>
					) : (
						userIds.map((userId) => (
							<FunctionUserCard key={userId} userId={userId} />
						))
					)}
				</section>

				<aside className="space-y-4">
					<FindUserCard />
					<FunctionCallLogCard />
				</aside>
			</div>
		</div>
	);
}
