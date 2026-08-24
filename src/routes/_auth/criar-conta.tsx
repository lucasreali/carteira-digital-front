import { zodResolver } from "@hookform/resolvers/zod";
import { IconWallet } from "@tabler/icons-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { type RegisterForm, registerFormSchema } from "@/api/schemas/auth";
import { useRegister } from "@/auth/mutations";
import { FormRow } from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Document } from "@/domain/document";
import { Phone } from "@/domain/phone";
import { reportApiError } from "@/lib/form";

export const Route = createFileRoute("/_auth/criar-conta")({
	ssr: false,
	component: RegisterScreen,
});

type RegisterPayload = z.output<typeof registerFormSchema>;

function RegisterScreen() {
	const navigate = useNavigate();
	const register = useRegister();

	const form = useForm<RegisterForm, unknown, RegisterPayload>({
		resolver: zodResolver(registerFormSchema),
		defaultValues: {
			full_name: "",
			email: "",
			document: "",
			phone: "",
			birth_date: "",
			password: "",
			password_confirmation: "",
			accepted_terms: false,
		},
	});

	const { errors } = form.formState;

	const submit = form.handleSubmit(async (values) => {
		try {
			await register.mutateAsync({
				full_name: values.full_name,
				email: values.email,
				document: values.document,
				phone: values.phone,
				password: values.password,
				birth_date: values.birth_date,
			});
			await navigate({ to: "/inicio" });
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["email", "document", "password", "phone"],
			});
		}
	});

	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<span className="flex size-9 items-center justify-center bg-primary text-primary-foreground lg:hidden">
					<IconWallet className="size-5" />
				</span>
				<h1 className="font-heading font-semibold text-2xl tracking-tight">
					Criar conta
				</h1>
				<p className="text-muted-foreground text-sm">
					Sua carteira em BRL é criada automaticamente. O KYC começa como
					pendente.
				</p>
			</div>

			<form onSubmit={submit} noValidate>
				<FieldGroup>
					<FormRow
						label="Nome completo"
						htmlFor="full_name"
						error={errors.full_name?.message}
					>
						<Input
							id="full_name"
							autoComplete="name"
							placeholder="Ana Souza"
							aria-invalid={Boolean(errors.full_name)}
							className="h-9 text-sm"
							{...form.register("full_name")}
						/>
					</FormRow>

					<FormRow label="E-mail" htmlFor="email" error={errors.email?.message}>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							placeholder="voce@exemplo.com"
							aria-invalid={Boolean(errors.email)}
							className="h-9 text-sm"
							{...form.register("email")}
						/>
					</FormRow>

					<div className="grid gap-5 sm:grid-cols-2">
						<Controller
							control={form.control}
							name="document"
							render={({ field }) => (
								<FormRow
									label="CPF ou CNPJ"
									htmlFor="document"
									error={errors.document?.message}
								>
									<Input
										id="document"
										inputMode="numeric"
										placeholder="000.000.000-00"
										aria-invalid={Boolean(errors.document)}
										className="h-9 text-sm"
										value={field.value}
										onBlur={field.onBlur}
										onChange={(event) =>
											field.onChange(Document.maskInput(event.target.value))
										}
									/>
								</FormRow>
							)}
						/>

						<Controller
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormRow
									label="Telefone"
									htmlFor="phone"
									error={errors.phone?.message}
								>
									<Input
										id="phone"
										inputMode="tel"
										placeholder="(41) 99999-8888"
										aria-invalid={Boolean(errors.phone)}
										className="h-9 text-sm"
										value={field.value}
										onBlur={field.onBlur}
										onChange={(event) =>
											field.onChange(Phone.maskInput(event.target.value))
										}
									/>
								</FormRow>
							)}
						/>
					</div>

					<FormRow
						label="Data de nascimento"
						htmlFor="birth_date"
						error={errors.birth_date?.message}
					>
						<Input
							id="birth_date"
							type="date"
							aria-invalid={Boolean(errors.birth_date)}
							className="h-9 text-sm"
							{...form.register("birth_date")}
						/>
					</FormRow>

					<FormRow
						label="Senha"
						htmlFor="password"
						error={errors.password?.message}
						description="Mínimo de 10 caracteres, com letra, número e caractere especial."
					>
						<Input
							id="password"
							type="password"
							autoComplete="new-password"
							aria-invalid={Boolean(errors.password)}
							className="h-9 text-sm"
							{...form.register("password")}
						/>
					</FormRow>

					<FormRow
						label="Confirmar senha"
						htmlFor="password_confirmation"
						error={errors.password_confirmation?.message}
					>
						<Input
							id="password_confirmation"
							type="password"
							autoComplete="new-password"
							aria-invalid={Boolean(errors.password_confirmation)}
							className="h-9 text-sm"
							{...form.register("password_confirmation")}
						/>
					</FormRow>

					<Controller
						control={form.control}
						name="accepted_terms"
						render={({ field }) => (
							<Field
								orientation="horizontal"
								data-invalid={Boolean(errors.accepted_terms)}
							>
								<Checkbox
									id="accepted_terms"
									checked={field.value}
									onCheckedChange={field.onChange}
									aria-invalid={Boolean(errors.accepted_terms)}
								/>
								<div className="space-y-1">
									<FieldLabel htmlFor="accepted_terms" className="text-sm">
										Aceito os termos de uso
									</FieldLabel>
									<FieldDescription>
										Autorizo a criação da conta e o tratamento dos meus dados
										para verificação de identidade.
									</FieldDescription>
									<FieldError>{errors.accepted_terms?.message}</FieldError>
								</div>
							</Field>
						)}
					/>

					<Button
						type="submit"
						size="lg"
						className="w-full"
						disabled={register.isPending}
					>
						{register.isPending ? <Spinner /> : null}
						Criar conta
					</Button>
				</FieldGroup>
			</form>

			<p className="text-center text-muted-foreground text-sm">
				Já tem conta?{" "}
				<Link
					to="/entrar"
					className="text-primary underline-offset-4 hover:underline"
				>
					Entrar
				</Link>
			</p>
		</div>
	);
}
