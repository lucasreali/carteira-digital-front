import { IconChevronDown, IconLogout, IconUser } from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";

import type { User } from "@/api/schemas/user";
import { useLogout } from "@/auth/mutations";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { kycStatusLabels } from "@/lib/labels";

function initialsOf(fullName: string) {
	return fullName
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

export function UserMenu({ user }: { user: User }) {
	const navigate = useNavigate();
	const logout = useLogout();

	async function signOut() {
		await logout.mutateAsync(false);
		await navigate({ to: "/entrar" });
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						className="h-auto w-full justify-start gap-2.5 px-3 py-2.5"
					/>
				}
			>
				<Avatar className="size-7">
					<AvatarFallback className="bg-primary/15 text-primary text-xs">
						{initialsOf(user.full_name)}
					</AvatarFallback>
				</Avatar>
				<span className="flex min-w-0 flex-1 flex-col items-start">
					<span className="w-full truncate font-medium text-sm">
						{user.full_name}
					</span>
					<span className="w-full truncate text-muted-foreground text-xs">
						KYC {kycStatusLabels[user.kyc_status].toLowerCase()}
					</span>
				</span>
				<IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start" className="w-56">
				<DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem render={<Link to="/perfil" />}>
					<IconUser />
					Perfil
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={signOut}
					disabled={logout.isPending}
				>
					<IconLogout />
					Sair
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
