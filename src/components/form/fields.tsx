import type { ReactNode } from "react";

import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type FormRowProps = {
	label: string;
	htmlFor?: string;
	description?: ReactNode;
	error?: string;
	className?: string;
	children: ReactNode;
};

export function FormRow({
	label,
	htmlFor,
	description,
	error,
	className,
	children,
}: FormRowProps) {
	return (
		<Field data-invalid={Boolean(error)} className={className}>
			<FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
			{children}
			{description ? <FieldDescription>{description}</FieldDescription> : null}
			<FieldError>{error}</FieldError>
		</Field>
	);
}

export type SelectOption = { value: string; label: string };

type SelectInputProps = {
	value: string;
	onChange: (value: string) => void;
	options: ReadonlyArray<SelectOption>;
	placeholder?: string;
	invalid?: boolean;
	disabled?: boolean;
	id?: string;
};

export function SelectInput({
	value,
	onChange,
	options,
	placeholder = "Selecione",
	invalid,
	disabled,
	id,
}: SelectInputProps) {
	return (
		<Select
			items={options as Array<SelectOption>}
			value={value || null}
			onValueChange={(next) => onChange(String(next ?? ""))}
			disabled={disabled}
		>
			<SelectTrigger
				id={id}
				aria-invalid={invalid}
				className="h-9 w-full text-sm"
			>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem
						key={option.value}
						value={option.value}
						className="text-sm"
					>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function formatAmountInput(raw: string) {
	const digits = raw
		.replace(/\D/g, "")
		.replace(/^0+(?=\d)/, "")
		.slice(0, 12);
	if (!digits) return "";
	return (Number(digits) / 100).toLocaleString("pt-BR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

type MoneyInputProps = {
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	invalid?: boolean;
	id?: string;
	placeholder?: string;
	className?: string;
};

export function MoneyInput({
	value,
	onChange,
	onBlur,
	invalid,
	id,
	placeholder = "0,00",
	className,
}: MoneyInputProps) {
	return (
		<div className={cn("relative", className)}>
			<span className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 text-muted-foreground text-sm">
				R$
			</span>
			<Input
				id={id}
				inputMode="numeric"
				autoComplete="off"
				aria-invalid={invalid}
				placeholder={placeholder}
				value={value}
				onBlur={onBlur}
				onChange={(event) => onChange(formatAmountInput(event.target.value))}
				className="numeric h-11 pl-9 text-right font-heading text-lg tabular-nums"
			/>
		</div>
	);
}

type SwitchRowProps = {
	label: string;
	description?: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
};

export function SwitchRow({
	label,
	description,
	checked,
	onChange,
	disabled,
}: SwitchRowProps) {
	return (
		<Field
			orientation="horizontal"
			className="items-start justify-between gap-4"
		>
			<div className="flex flex-col gap-0.5">
				<FieldLabel className="text-sm">{label}</FieldLabel>
				{description ? (
					<FieldDescription>{description}</FieldDescription>
				) : null}
			</div>
			<Switch
				checked={checked}
				onCheckedChange={onChange}
				disabled={disabled}
			/>
		</Field>
	);
}
