import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "positive" | "pending" | "negative" | "neutral";

const toneClasses: Record<Tone, string> = {
	positive: "bg-credit/15 text-credit",
	pending: "bg-warning/15 text-warning",
	negative: "bg-destructive/15 text-destructive",
	neutral: "bg-muted text-muted-foreground",
};

const tones: Record<string, Tone> = {
	completed: "positive",
	approved: "positive",
	verified: "positive",
	active: "positive",
	paid: "positive",
	pending: "pending",
	processing: "pending",
	in_review: "pending",
	pending_verification: "pending",
	pending_portability: "pending",
	closing: "pending",
	failed: "negative",
	rejected: "negative",
	blocked: "negative",
	frozen: "negative",
	reversed: "neutral",
	canceled: "neutral",
	expired: "neutral",
	closed: "neutral",
	inactive: "neutral",
	disabled: "neutral",
};

export function StatusBadge({
	status,
	label,
}: {
	status: string;
	label: string;
}) {
	return (
		<Badge
			variant="outline"
			className={cn(
				"border-transparent font-medium",
				toneClasses[tones[status] ?? "neutral"],
			)}
		>
			{label}
		</Badge>
	);
}
