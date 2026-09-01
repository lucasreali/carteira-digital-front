// A API de usuários em Functions não expõe listagem: o app guarda localmente os
// ObjectId que criou ou consultou para conseguir montar a tela de gerenciamento.
const STORAGE_KEY = "carteira-digital:function-user-ids";
const EMPTY: ReadonlyArray<string> = [];

const listeners = new Set<() => void>();

let ids: ReadonlyArray<string> = EMPTY;
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
		ids = (JSON.parse(raw) as Array<unknown>).filter(
			(id): id is string => typeof id === "string",
		);
	} catch {
		window.localStorage.removeItem(STORAGE_KEY);
	}
}

function persist(next: ReadonlyArray<string>) {
	ids = next;
	if (isBrowser())
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	for (const listener of listeners) listener();
}

export const functionUserIds = {
	subscribe(listener: () => void) {
		hydrate();
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
	read() {
		hydrate();
		return ids;
	},
	readOnServer(): ReadonlyArray<string> {
		return EMPTY;
	},
	remember(userId: string) {
		hydrate();
		if (ids.includes(userId)) return;
		persist([userId, ...ids]);
	},
	forget(userId: string) {
		hydrate();
		persist(ids.filter((id) => id !== userId));
	},
};
