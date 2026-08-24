import { Money } from "@/domain/money";
import { cn } from "@/lib/utils";

type AmountTextProps = {
	cents: number;
	currency?: string;
	direction?: "credit" | "debit";
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
	const prefix =
		!showSign || !direction ? "" : direction === "credit" ? "+" : "−";

	return (
		<span
			className={cn(
				"numeric font-medium tabular-nums",
				direction === "credit" && "text-credit",
				direction === "debit" && "text-foreground",
				className,
			)}
		>
			{prefix}
			{money.toString()}
		</span>
	);
}
