import { zodResolver } from "@hookform/resolvers/zod";
import { IconPencil, IconPlus, IconReplace } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { toast } from "sonner";

import type { FunctionUserPatch } from "@/api/endpoints/function-users";
import {
	useCreateFunctionUser,
	useReplaceFunctionUser,
	useUpdateFunctionUser,
} from "@/api/queries/function-users";
import {
	type FunctionUser,
	type FunctionUserForm,
	functionUserFormSchema,
} from "@/api/schemas/function-user";
import { FormRow } from "@/components/form/fields";
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

type FormFieldsProps = {
	form: UseFormReturn<FunctionUserForm>;
	idPrefix: string;
};

function FunctionUserFields({ form, idPrefix }: FormFieldsProps) {
	const { errors } = form.formState;

	return (
		<>
			<FormRow
				label="Nome"
				htmlFor={`${idPrefix}-nome`}
				error={errors.nome?.message}
			>
				<Input
					id={`${idPrefix}-nome`}
					placeholder="Lucas Reali"
					className="h-9 text-sm"
					aria-invalid={Boolean(errors.nome)}
					{...form.register("nome")}
				/>
			</FormRow>

			<FormRow
				label="E-mail"
				htmlFor={`${idPrefix}-email`}
				error={errors.email?.message}
			>
				<Input
					id={`${idPrefix}-email`}
					type="email"
					placeholder="lucas@exemplo.com"
					className="h-9 text-sm"
					aria-invalid={Boolean(errors.email)}
					{...form.register("email")}
				/>
			</FormRow>
		</>
	);
}

function DialogShell({
	open,
	onOpenChange,
	trigger,
	title,
	description,
	children,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trigger: ReactNode;
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{trigger}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
}

export function CreateFunctionUserDialog() {
	const [open, setOpen] = useState(false);
	const createUser = useCreateFunctionUser();

	const form = useForm<FunctionUserForm>({
		resolver: zodResolver(functionUserFormSchema),
		defaultValues: { nome: "", email: "" },
	});

	const submit = form.handleSubmit(async (values) => {
		try {
			const user = await createUser.mutateAsync(values);
			toast.success(`Usuário criado com o id ${user._id}.`);
			form.reset();
			setOpen(false);
		} catch (error) {
			reportApiError(error, { setError: form.setError });
		}
	});

	return (
		<DialogShell
			open={open}
			onOpenChange={setOpen}
			title="Novo usuário"
			description="POST /users cria o documento no MongoDB Atlas pela Azure Function."
			trigger={
				<DialogTrigger render={<Button size="sm" />}>
					<IconPlus />
					Novo usuário
				</DialogTrigger>
			}
		>
			<form onSubmit={submit} noValidate>
				<FieldGroup>
					<FunctionUserFields form={form} idPrefix="create-user" />
					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={() => setOpen(false)}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={createUser.isPending}>
							{createUser.isPending ? <Spinner /> : null}
							Criar
						</Button>
					</DialogFooter>
				</FieldGroup>
			</form>
		</DialogShell>
	);
}

type EditMode = "patch" | "put";

const editModes = {
	patch: {
		title: "Editar usuário",
		description: "PATCH /users/{id} envia apenas os campos alterados.",
		action: "Salvar",
		label: "Editar usuário (PATCH)",
		icon: IconPencil,
	},
	put: {
		title: "Substituir usuário",
		description: "PUT /users/{id} envia nome e e-mail por completo.",
		action: "Substituir",
		label: "Substituir usuário (PUT)",
		icon: IconReplace,
	},
} as const satisfies Record<EditMode, unknown>;

function patchFrom(
	values: FunctionUserForm,
	dirtyFields: Partial<Record<keyof FunctionUserForm, boolean>>,
) {
	const body: FunctionUserPatch = {};
	if (dirtyFields.nome) body.nome = values.nome;
	if (dirtyFields.email) body.email = values.email;
	return body;
}

export function EditFunctionUserDialog({
	user,
	mode,
}: {
	user: FunctionUser;
	mode: EditMode;
}) {
	const [open, setOpen] = useState(false);
	const updateUser = useUpdateFunctionUser();
	const replaceUser = useReplaceFunctionUser();
	const copy = editModes[mode];

	const form = useForm<FunctionUserForm>({
		resolver: zodResolver(functionUserFormSchema),
		values: { nome: user.nome, email: user.email },
	});

	function save(values: FunctionUserForm) {
		if (mode === "put") {
			return replaceUser.mutateAsync({ userId: user._id, body: values });
		}
		return updateUser.mutateAsync({
			userId: user._id,
			body: patchFrom(values, form.formState.dirtyFields),
		});
	}

	const submit = form.handleSubmit(async (values) => {
		try {
			await save(values);
			toast.success("Usuário atualizado.");
			setOpen(false);
		} catch (error) {
			reportApiError(error, { setError: form.setError });
		}
	});

	const pending = updateUser.isPending || replaceUser.isPending;

	return (
		<DialogShell
			open={open}
			onOpenChange={setOpen}
			title={copy.title}
			description={copy.description}
			trigger={
				<DialogTrigger
					render={
						<Button variant="ghost" size="icon-sm" aria-label={copy.label} />
					}
				>
					<copy.icon />
				</DialogTrigger>
			}
		>
			<form onSubmit={submit} noValidate>
				<FieldGroup>
					<FunctionUserFields form={form} idPrefix={`${mode}-${user._id}`} />
					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={() => setOpen(false)}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={
								pending || (mode === "patch" && !form.formState.isDirty)
							}
						>
							{pending ? <Spinner /> : null}
							{copy.action}
						</Button>
					</DialogFooter>
				</FieldGroup>
			</form>
		</DialogShell>
	);
}
