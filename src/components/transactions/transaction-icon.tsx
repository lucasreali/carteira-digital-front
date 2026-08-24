import {
	IconArrowDownLeft,
	IconArrowsExchange,
	IconArrowUpRight,
	IconBuildingBank,
	IconCreditCard,
	IconQrcode,
	IconReceipt2,
	IconRotateClockwise,
	type TablerIcon,
} from "@tabler/icons-react";

import type { TransactionType } from "@/api/schemas/transaction";
import { cn } from "@/lib/utils";

const icons: Record<TransactionType, TablerIcon> = {
	deposit: IconBuildingBank,
	withdrawal: IconCreditCard,
	transfer: IconArrowsExchange,
	pix_in: IconQrcode,
	pix_out: IconQrcode,
	reversal: IconRotateClockwise,
	fee: IconReceipt2,
};

export function TransactionIcon({
	type,
	direction,
	size = "default",
}: {
	type: TransactionType;
	direction: "credit" | "debit";
	size?: "default" | "lg";
}) {
	const Icon =
		icons[type] ??
		(direction === "credit" ? IconArrowDownLeft : IconArrowUpRight);

	return (
		<span
			className={cn(
				"flex shrink-0 items-center justify-center",
				size === "lg" ? "size-12" : "size-9",
				direction === "credit"
					? "bg-credit/12 text-credit"
					: "bg-muted text-muted-foreground",
			)}
		>
			<Icon className={size === "lg" ? "size-6" : "size-4"} />
		</span>
	);
}
