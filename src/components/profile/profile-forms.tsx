import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { useUpdateProfile } from "@/api/queries/users";
import {
	changeEmailFormSchema,
	changePasswordFormSchema,
	type UpdateProfileForm,
	type User,
	updateProfileFormSchema,
} from "@/api/schemas/user";
import { FormRow } from "@/components/form/fields";
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
import { Spinner } from "@/components/ui/spinner";
import { Phone } from "@/domain/phone";
import { reportApiError } from "@/lib/form";

type UpdateProfilePayload = z.output<typeof updateProfileFormSchema>;
type ChangeEmailForm = z.infer<typeof changeEmailFormSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordFormSchema>;

export function PersonalDataForm({ user }: { user: User }) {
	const updateProfile = useUpdateProfile();

	const form = useForm<UpdateProfileForm, unknown, UpdateProfilePayload>({
		resolver: zodResolver(updateProfileFormSchema),
		values: {
			full_name: user.full_name,
			phone: user.phone ? Phone.maskInput(user.phone) : "",
		},
	});

	const submit = form.handleSubmit(async (values) => {
		try {
			await updateProfile.mutateAsync({ body: values, version: user.version });
			toast.success("Dados atualizados.");
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["full_name", "phone"],
			});
		}
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Dados pessoais</CardTitle>
				<CardDescription>
					CPF e data de nascimento ficam imutáveis após a aprovação do KYC.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={submit} noValidate>
					<FieldGroup>
						<FormRow
							label="Nome completo"
							htmlFor="full_name"
							error={form.formState.errors.full_name?.message}
						>
							<Input
								id="full_name"
								className="h-9 text-sm"
								aria-invalid={Boolean(form.formState.errors.full_name)}
								{...form.register("full_name")}
							/>
						</FormRow>

						<Controller
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormRow
									label="Telefone"
									htmlFor="phone"
									error={form.formState.errors.phone?.message}
									description="Alterar o telefone dispara uma nova verificação."
								>
									<Input
										id="phone"
										inputMode="tel"
										className="h-9 text-sm"
										aria-invalid={Boolean(form.formState.errors.phone)}
										value={field.value ?? ""}
										onBlur={field.onBlur}
										onChange={(event) =>
											field.onChange(Phone.maskInput(event.target.value))
										}
									/>
								</FormRow>
							)}
						/>

						<div className="flex justify-end">
							<Button type="submit" disabled={updateProfile.isPending}>
								{updateProfile.isPending ? <Spinner /> : null}
								Salvar alterações
							</Button>
						</div>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	);
}

export function ChangeEmailForm({ user }: { user: User }) {
	const updateProfile = useUpdateProfile();

	const form = useForm<ChangeEmailForm>({
		resolver: zodResolver(changeEmailFormSchema),
		defaultValues: { email: user.email, current_password: "" },
	});

	const submit = form.handleSubmit(async (values) => {
		try {
			await updateProfile.mutateAsync({ body: values, version: user.version });
			toast.success(
				"E-mail atualizado. Verifique a caixa de entrada para confirmar.",
			);
			form.reset({ email: values.email, current_password: "" });
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["email", "current_password"],
			});
		}
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>E-mail</CardTitle>
				<CardDescription>
					Alterar o e-mail dispara reverificação da conta.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={submit} noValidate>
					<FieldGroup>
						<FormRow
							label="Novo e-mail"
							htmlFor="email"
							error={form.formState.errors.email?.message}
						>
							<Input
								id="email"
								type="email"
								className="h-9 text-sm"
								aria-invalid={Boolean(form.formState.errors.email)}
								{...form.register("email")}
							/>
						</FormRow>

						<FormRow
							label="Senha atual"
							htmlFor="email-current-password"
							error={form.formState.errors.current_password?.message}
						>
							<Input
								id="email-current-password"
								type="password"
								autoComplete="current-password"
								className="h-9 text-sm"
								aria-invalid={Boolean(form.formState.errors.current_password)}
								{...form.register("current_password")}
							/>
						</FormRow>

						<div className="flex justify-end">
							<Button
								type="submit"
								variant="outline"
								disabled={updateProfile.isPending}
							>
								{updateProfile.isPending ? <Spinner /> : null}
								Alterar e-mail
							</Button>
						</div>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	);
}

export function ChangePasswordForm({ user }: { user: User }) {
	const updateProfile = useUpdateProfile();

	const form = useForm<ChangePasswordForm>({
		resolver: zodResolver(changePasswordFormSchema),
		defaultValues: {
			current_password: "",
			password: "",
			password_confirmation: "",
		},
	});

	const submit = form.handleSubmit(async (values) => {
		try {
			await updateProfile.mutateAsync({
				body: {
					current_password: values.current_password,
					password: values.password,
				},
				version: user.version,
			});
			toast.success("Senha alterada.");
			form.reset();
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["current_password", "password"],
			});
		}
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Senha</CardTitle>
				<CardDescription>Mínimo de 4 caracteres.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={submit} noValidate>
					<FieldGroup>
						<FormRow
							label="Senha atual"
							htmlFor="current_password"
							error={form.formState.errors.current_password?.message}
						>
							<Input
								id="current_password"
								type="password"
								autoComplete="current-password"
								className="h-9 text-sm"
								aria-invalid={Boolean(form.formState.errors.current_password)}
								{...form.register("current_password")}
							/>
						</FormRow>

						<FormRow
							label="Nova senha"
							htmlFor="new_password"
							error={form.formState.errors.password?.message}
						>
							<Input
								id="new_password"
								type="password"
								autoComplete="new-password"
								className="h-9 text-sm"
								aria-invalid={Boolean(form.formState.errors.password)}
								{...form.register("password")}
							/>
						</FormRow>

						<FormRow
							label="Confirmar nova senha"
							htmlFor="password_confirmation"
							error={form.formState.errors.password_confirmation?.message}
						>
							<Input
								id="password_confirmation"
								type="password"
								autoComplete="new-password"
								className="h-9 text-sm"
								aria-invalid={Boolean(
									form.formState.errors.password_confirmation,
								)}
								{...form.register("password_confirmation")}
							/>
						</FormRow>

						<div className="flex justify-end">
							<Button
								type="submit"
								variant="outline"
								disabled={updateProfile.isPending}
							>
								{updateProfile.isPending ? <Spinner /> : null}
								Alterar senha
							</Button>
						</div>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	);
}
