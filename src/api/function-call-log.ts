export type FunctionCall = {
	id: string;
	method: string;
	path: string;
	status: number | null;
	milliseconds: number;
	at: number;
};

const HISTORY_SIZE = 8;
const EMPTY: ReadonlyArray<FunctionCall> = [];

const listeners = new Set<() => void>();

let calls: ReadonlyArray<FunctionCall> = EMPTY;
let sequence = 0;

function notify() {
	for (const listener of listeners) listener();
}

export const functionCallLog = {
	subscribe(listener: () => void) {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
	read() {
		return calls;
	},
	readOnServer(): ReadonlyArray<FunctionCall> {
		return EMPTY;
	},
	record(call: Omit<FunctionCall, "id" | "at">) {
		sequence += 1;
		calls = [{ ...call, id: String(sequence), at: Date.now() }, ...calls].slice(
			0,
			HISTORY_SIZE,
		);
		notify();
	},
};
