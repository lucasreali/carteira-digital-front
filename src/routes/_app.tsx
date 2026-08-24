import { IconMenu2, IconMoon, IconSun, IconWallet } from "@tabler/icons-react";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useState } from "react";

import { sessionStore } from "@/auth/session";
import { useCurrentUser } from "@/auth/use-session";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_app")({
	ssr: false,
	beforeLoad: () => {
		if (!sessionStore.read()) throw redirect({ to: "/entrar" });
	},
	component: AppLayout,
});

function Brand() {
	return (
		<Link to="/inicio" className="flex items-center gap-2 px-3 py-1">
			<span className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
				<IconWallet className="size-4" />
			</span>
			<span className="font-heading font-semibold text-sm tracking-tight">
				Carteira Digital
			</span>
		</Link>
	);
}

function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const isDark = resolvedTheme !== "light";

	return (
		<Button
			variant="ghost"
			size="icon-sm"
			aria-label={isDark ? "Usar tema claro" : "Usar tema escuro"}
			onClick={() => setTheme(isDark ? "light" : "dark")}
		>
			{isDark ? <IconSun /> : <IconMoon />}
		</Button>
	);
}

function AppLayout() {
	const user = useCurrentUser();
	const [mobileOpen, setMobileOpen] = useState(false);

	if (!user) return null;

	return (
		<div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
			<aside className="hidden border-sidebar-border border-r bg-sidebar lg:flex lg:h-screen lg:flex-col lg:gap-6 lg:overflow-y-auto lg:py-5">
				<Brand />
				<div className="flex-1 px-2">
					<SidebarNav />
				</div>
				<div className="border-sidebar-border border-t px-2 pt-3">
					<UserMenu user={user} />
				</div>
			</aside>

			<div className="flex min-h-screen flex-col">
				<header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-border/60 border-b bg-background/85 px-4 backdrop-blur lg:justify-end lg:px-8">
					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger
							render={
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Abrir menu"
								/>
							}
							className="lg:hidden"
						>
							<IconMenu2 />
						</SheetTrigger>
						<SheetContent side="left" className="w-72 bg-sidebar p-0">
							<SheetHeader className="border-sidebar-border border-b">
								<SheetTitle className="font-heading">
									Carteira Digital
								</SheetTitle>
							</SheetHeader>
							<div className="flex-1 overflow-y-auto px-2 py-4">
								<SidebarNav onNavigate={() => setMobileOpen(false)} />
							</div>
							<div className="border-sidebar-border border-t px-2 py-3">
								<UserMenu user={user} />
							</div>
						</SheetContent>
					</Sheet>

					<div className="flex items-center gap-1 lg:hidden">
						<IconWallet className="size-4 text-primary" />
						<span className="font-heading font-semibold text-sm">Carteira</span>
					</div>

					<ThemeToggle />
				</header>

				<main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 lg:px-8 lg:py-8">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
