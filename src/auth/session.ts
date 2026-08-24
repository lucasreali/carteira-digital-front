import type { User } from "@/api/schemas/user";

const STORAGE_KEY = "carteira-digital:session";

export type Session = {
	access_token: string;
	refresh_token: string;
	expires_at: number;
	user: User;
};

const listeners = new Set<() => void>();

let current: Session | null = null;
let hydrated = false;

function isBrowser() {
	return typeof window !== "undefined";
}

function hydrate() {
	if (hydrated || !isBrowser()) return;
	hydrated = true;
	const raw = window.localStorage.getItem(STORAGE_KEY);
	if (!raw) return;
	try {
		current = JSON.parse(raw) as Session;
	} catch {
		window.localStorage.removeItem(STORAGE_KEY);
	}
}

function notify() {
	for (const listener of listeners) listener();
}

export const sessionStore = {
	subscribe(listener: () => void) {
		hydrate();
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
	read() {
		hydrate();
		return current;
	},
	readOnServer(): Session | null {
		return null;
	},
	save(session: Session) {
		hydrated = true;
		current = session;
		if (isBrowser())
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
		notify();
	},
	clear() {
		hydrated = true;
		current = null;
		if (isBrowser()) window.localStorage.removeItem(STORAGE_KEY);
		notify();
	},
};

export function sessionFrom(payload: {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	user: User;
}): Session {
	return {
		access_token: payload.access_token,
		refresh_token: payload.refresh_token,
		expires_at: Date.now() + payload.expires_in * 1000,
		user: payload.user,
	};
}
