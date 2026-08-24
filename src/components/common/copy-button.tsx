import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type CopyButtonProps = {
	value: string;
	label?: string;
	size?: "default" | "sm" | "icon-sm";
};

export function CopyButton({
	value,
	label = "Copiar",
	size = "sm",
}: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Não foi possível copiar. Copie manualmente.");
		}
	}

	const icon = copied ? <IconCheck /> : <IconCopy />;

	if (size === "icon-sm") {
		return (
			<Button variant="ghost" size="icon-sm" onClick={copy} aria-label={label}>
				{icon}
			</Button>
		);
	}

	return (
		<Button variant="outline" size={size} onClick={copy}>
			{icon}
			{copied ? "Copiado" : label}
		</Button>
	);
}
