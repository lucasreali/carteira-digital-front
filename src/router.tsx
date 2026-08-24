import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { installMockApi } from "./api/mock";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	installMockApi();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
		},
	});

	const router = createTanStackRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
