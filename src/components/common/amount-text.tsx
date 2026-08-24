import { Money } from "@/domain/money";
import { cn } from "@/lib/utils";

export type AmountDirection = "credit" | "debit" | "internal";

const signs: Record<AmountDirection, string> = {
	credit: "+",
	debit: "\u2212",
	internal: "",
};

type AmountTextProps = {
	cents: number;
	currency?: string;
	direction?: AmountDirection;
	className?: string;
	showSign?: boolean;
};

export function AmountText({
	cents,
	currency = "BRL",
	direction,
	className,
	showSign = true,
}: AmountTextProps) {
	const money = Money.fromCents(cents, currency);
	const prefix = showSign && direction ? signs[direction] : "";

	return (
		<span
			className={cn(
				"numeric font-medium tabular-nums",
				direction === "credit" && "text-credit",
				className,
			)}
		>
			{prefix}
			{money.toString()}
		</span>
	);
}
