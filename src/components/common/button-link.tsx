import { createLink } from "@tanstack/react-router";
import type { VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StyledAnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
	VariantProps<typeof buttonVariants>;

const StyledAnchor = forwardRef<HTMLAnchorElement, StyledAnchorProps>(
	({ className, variant, size, ...props }, ref) => (
		<a
			ref={ref}
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	),
);
StyledAnchor.displayName = "StyledAnchor";

export const ButtonLink = createLink(StyledAnchor);
