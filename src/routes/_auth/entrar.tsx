import { zodResolver } from "@hookform/resolvers/zod";
import { IconEye, IconEyeOff, IconWallet } from "@tabler/icons-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { mockApiEnabled } from "@/api/config";
import { type LoginForm, loginFormSchema } from "@/api/schemas/auth";
import { useLogin } from "@/auth/mutations";
import { FormRow } from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { reportApiError } from "@/lib/form";

export const Route = createFileRoute("/_auth/entrar")({
	ssr: false,
	component: LoginScreen,
});

const demoCredentials = {
	email: "ana.souza@example.com",
	password: "S3nh@ForteAqui",
};

function LoginScreen() {
	const navigate = useNavigate();
	const login = useLogin();
	const [revealed, setRevealed] = useState(false);

	const form = useForm<LoginForm>({
		resolver: zodResolver(loginFormSchema),
		defaultValues: { email: "", password: "" },
	});

	const submit = form.handleSubmit(async (values) => {
		try {
			await login.mutateAsync(values);
			await navigate({ to: "/inicio" });
		} catch (error) {
			reportApiError(error, {
				setError: form.setError,
				knownFields: ["email", "password"],
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
					Entrar na conta
				</h1>
				<p className="text-muted-foreground text-sm">
					Use seu e-mail e senha para acessar suas carteiras.
				</p>
			</div>

			<form onSubmit={submit} noValidate>
				<FieldGroup>
					<FormRow
						label="E-mail"
						htmlFor="email"
						error={form.formState.errors.email?.message}
					>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							placeholder="voce@exemplo.com"
							aria-invalid={Boolean(form.formState.errors.email)}
							className="h-9 text-sm"
							{...form.register("email")}
						/>
					</FormRow>

					<FormRow
						label="Senha"
						htmlFor="password"
						error={form.formState.errors.password?.message}
					>
						<div className="relative">
							<Input
								id="password"
								type={revealed ? "text" : "password"}
								autoComplete="current-password"
								placeholder="••••••••••"
								aria-invalid={Boolean(form.formState.errors.password)}
								className="h-9 pr-9 text-sm"
								{...form.register("password")}
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="-translate-y-1/2 absolute top-1/2 right-1"
								aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
								onClick={() => setRevealed((current) => !current)}
							>
								{revealed ? <IconEyeOff /> : <IconEye />}
							</Button>
						</div>
					</FormRow>

					<Button
						type="submit"
						size="lg"
						className="w-full"
						disabled={login.isPending}
					>
						{login.isPending ? <Spinner /> : null}
						Entrar
					</Button>
				</FieldGroup>
			</form>

			<div className="space-y-4">
				<p className="text-center text-muted-foreground text-sm">
					Ainda não tem conta?{" "}
					<Link
						to="/criar-conta"
						className="text-primary underline-offset-4 hover:underline"
					>
						Criar conta
					</Link>
				</p>

				{mockApiEnabled ? (
					<button
						type="button"
						onClick={() => form.reset(demoCredentials)}
						className="w-full border border-border/60 border-dashed p-3 text-left transition-colors hover:bg-muted/40"
					>
						<p className="font-medium text-xs">
							Preencher credenciais de demonstração
						</p>
						<p className="mt-0.5 text-muted-foreground text-xs">
							{demoCredentials.email} · {demoCredentials.password}
						</p>
					</button>
				) : null}
			</div>
		</div>
	);
}
