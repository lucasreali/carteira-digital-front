import { IconCloudComputing } from "@tabler/icons-react";

import { usersFunctionBaseUrl, usersFunctionRegion } from "@/api/config";
import type { FunctionCall } from "@/api/function-call-log";
import { useFunctionCalls } from "@/api/queries/function-users";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
});

function statusVariant(status: number | null) {
	if (status === null) return "destructive";
	if (status >= 400) return "destructive";
	return "secondary";
}

function statusLabel(status: number | null) {
	return status === null ? "sem resposta" : String(status);
}

function CallRow({ call }: { call: FunctionCall }) {
	return (
		<li className="flex items-center gap-2 py-1.5 font-mono text-xs">
			<span className="w-16 shrink-0 text-muted-foreground">
				{timeFormatter.format(call.at)}
			</span>
			<span className="w-14 shrink-0 font-medium">{call.method}</span>
			<span className="min-w-0 flex-1 truncate text-muted-foreground">
				/api{call.path}
			</span>
			<span className="w-14 shrink-0 text-right text-muted-foreground">
				{call.milliseconds} ms
			</span>
			<Badge variant={statusVariant(call.status)} className="shrink-0">
				{statusLabel(call.status)}
			</Badge>
		</li>
	);
}

export function FunctionCallLogCard() {
	const calls = useFunctionCalls();

	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<IconCloudComputing className="size-4 text-primary" />
					Chamadas à Azure Function
				</CardTitle>
				<CardDescription className="break-all">
					{usersFunctionBaseUrl} · {usersFunctionRegion}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{calls.length === 0 ? (
					<p className="text-muted-foreground text-xs">
						Nenhuma requisição nesta sessão ainda.
					</p>
				) : (
					<ul className="divide-y divide-border/60">
						{calls.map((call) => (
							<CallRow key={call.id} call={call} />
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
