import { useSyncExternalStore } from "react";

import { sessionStore } from "./session";

export function useSession() {
	return useSyncExternalStore(
		sessionStore.subscribe,
		sessionStore.read,
		sessionStore.readOnServer,
	);
}

export function useCurrentUser() {
	const session = useSession();
	return session?.user ?? null;
}
