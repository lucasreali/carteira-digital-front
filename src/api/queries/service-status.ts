import { useQuery } from "@tanstack/react-query";

import { fetchServiceStatus } from "@/api/endpoints/service-status";
import { queryKeys } from "./keys";

export function useServiceStatus(name: string) {
	return useQuery({
		queryKey: queryKeys.serviceStatus(name),
		queryFn: () => fetchServiceStatus(name),
	});
}
