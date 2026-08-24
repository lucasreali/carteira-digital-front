const CENTS_IN_UNIT = 100;

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string) {
	const cached = formatters.get(currency);
	if (cached) return cached;
	const created = new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency,
	});
	formatters.set(currency, created);
	return created;
}

export class Money {
	private constructor(
		private readonly cents: number,
		private readonly currency: string,
	) {}

	static fromCents(cents: number, currency = "BRL") {
		return new Money(Math.round(cents), currency);
	}

	static zero(currency = "BRL") {
		return new Money(0, currency);
	}

	static parse(input: string, currency = "BRL"): Money | null {
		const digitsAndSeparators = input.replace(/[^\d,.-]/g, "");
		if (digitsAndSeparators === "") return null;
		const normalized = digitsAndSeparators.replace(/\./g, "").replace(",", ".");
		const parsed = Number(normalized);
		if (Number.isNaN(parsed)) return null;
		return new Money(Math.round(parsed * CENTS_IN_UNIT), currency);
	}

	plus(other: Money) {
		return new Money(this.cents + other.cents, this.currency);
	}

	minus(other: Money) {
		return new Money(this.cents - other.cents, this.currency);
	}

	isZero() {
		return this.cents === 0;
	}

	isNegative() {
		return this.cents < 0;
	}

	isGreaterThan(other: Money) {
		return this.cents > other.cents;
	}

	absolute() {
		return new Money(Math.abs(this.cents), this.currency);
	}

	toCents() {
		return this.cents;
	}

	toInputValue() {
		return (this.cents / CENTS_IN_UNIT).toFixed(2).replace(".", ",");
	}

	toString() {
		return formatterFor(this.currency).format(this.cents / CENTS_IN_UNIT);
	}

	toSignedString() {
		return this.isNegative() ? this.toString() : `+${this.toString()}`;
	}
}
