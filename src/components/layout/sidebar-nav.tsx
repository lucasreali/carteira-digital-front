import { Link } from "@tanstack/react-router";

import { navigationGroups } from "./navigation";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
	return (
		<nav className="flex flex-col gap-6">
			{navigationGroups.map((group) => (
				<div key={group.title} className="space-y-1">
					<p className="px-3 pb-1 font-medium text-[0.65rem] text-muted-foreground uppercase tracking-widest">
						{group.title}
					</p>
					{group.links.map((link) => (
						<Link
							key={link.to}
							to={link.to}
							onClick={onNavigate}
							activeOptions={{ exact: link.to === "/perfil" }}
							className="flex items-center gap-2.5 px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-primary/10 data-[status=active]:font-medium data-[status=active]:text-primary"
						>
							<link.icon className="size-4 shrink-0" />
							{link.label}
						</Link>
					))}
				</div>
			))}
		</nav>
	);
}
