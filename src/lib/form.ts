import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiError } from "@/api/http";

const GENERIC_MESSAGE =
	"Não foi possível concluir a operação. Tente novamente.";

export function describeError(error: unknown) {
	return error instanceof ApiError ? error.message : GENERIC_MESSAGE;
}

export function reportApiError<TValues extends FieldValues>(
	error: unknown,
	options: {
		setError?: UseFormSetError<TValues>;
		knownFields?: ReadonlyArray<Path<TValues>>;
	} = {},
) {
	if (!(error instanceof ApiError)) {
		toast.error(GENERIC_MESSAGE);
		return;
	}

	const issues = Object.entries(error.fieldIssues());
	const known = new Set<string>(options.knownFields ?? []);
	const attached = issues.filter(([field]) => known.has(field));

	for (const [field, issue] of attached) {
		options.setError?.(field as Path<TValues>, { message: issue });
	}

	toast.error(error.message, {
		description: attached.length === 0 ? issues[0]?.[1] : undefined,
	});
}
