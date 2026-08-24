const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

function digitsOf(raw: string) {
	return raw.replace(/\D/g, "");
}

function hasRepeatedDigits(digits: string) {
	return new Set(digits).size === 1;
}

function checkDigit(digits: string, weights: ReadonlyArray<number>) {
	const sum = weights.reduce(
		(total, weight, index) => total + weight * Number(digits[index]),
		0,
	);
	const remainder = sum % 11;
	return remainder < 2 ? 0 : 11 - remainder;
}

function isValidCpf(digits: string) {
	if (digits.length !== CPF_LENGTH || hasRepeatedDigits(digits)) return false;
	const first = checkDigit(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
	const second = checkDigit(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
	return first === Number(digits[9]) && second === Number(digits[10]);
}

function isValidCnpj(digits: string) {
	if (digits.length !== CNPJ_LENGTH || hasRepeatedDigits(digits)) return false;
	const first = checkDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
	const second = checkDigit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
	return first === Number(digits[12]) && second === Number(digits[13]);
}

export class Document {
	private constructor(private readonly digits: string) {}

	static parse(raw: string): Document | null {
		const digits = digitsOf(raw);
		if (isValidCpf(digits) || isValidCnpj(digits)) return new Document(digits);
		return null;
	}

	static isValid(raw: string) {
		return Document.parse(raw) !== null;
	}

	static maskInput(raw: string) {
		const digits = digitsOf(raw).slice(0, CNPJ_LENGTH);
		if (digits.length <= CPF_LENGTH) {
			return digits
				.replace(/^(\d{3})(\d)/, "$1.$2")
				.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
				.replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
		}
		return digits
			.replace(/^(\d{2})(\d)/, "$1.$2")
			.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
			.replace(/\.(\d{3})(\d)/, ".$1/$2")
			.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
	}

	isCompany() {
		return this.digits.length === CNPJ_LENGTH;
	}

	toDigits() {
		return this.digits;
	}

	toString() {
		return Document.maskInput(this.digits);
	}
}
