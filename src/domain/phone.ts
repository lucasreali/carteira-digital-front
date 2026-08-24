const BRAZIL_PREFIX = "+55";

function digitsOf(raw: string) {
	return raw.replace(/\D/g, "");
}

export class Phone {
	private constructor(private readonly nationalDigits: string) {}

	static parse(raw: string): Phone | null {
		const digits = digitsOf(raw).replace(/^55/, "");
		if (digits.length < 10 || digits.length > 11) return null;
		return new Phone(digits);
	}

	static isValid(raw: string) {
		return Phone.parse(raw) !== null;
	}

	static maskInput(raw: string) {
		const digits = digitsOf(raw).replace(/^55/, "").slice(0, 11);
		if (digits.length <= 10) {
			return digits
				.replace(/^(\d{2})(\d)/, "($1) $2")
				.replace(/(\d{4})(\d{1,4})$/, "$1-$2");
		}
		return digits
			.replace(/^(\d{2})(\d)/, "($1) $2")
			.replace(/(\d{5})(\d{1,4})$/, "$1-$2");
	}

	toE164() {
		return `${BRAZIL_PREFIX}${this.nationalDigits}`;
	}

	toString() {
		return Phone.maskInput(this.nationalDigits);
	}
}
