const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
});

const dayMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
	day: "2-digit",
	month: "short",
});

export function formatDateTime(iso: string | null | undefined) {
	if (!iso) return "—";
	return dateTimeFormatter.format(new Date(iso));
}

export function formatDate(iso: string | null | undefined) {
	if (!iso) return "—";
	return dateFormatter.format(new Date(iso));
}

export function formatDayMonth(iso: string) {
	return dayMonthFormatter.format(new Date(iso));
}

export function toDateInputValue(date: Date) {
	return date.toISOString().slice(0, 10);
}

export function daysAgo(days: number) {
	const date = new Date();
	date.setDate(date.getDate() - days);
	return date;
}
