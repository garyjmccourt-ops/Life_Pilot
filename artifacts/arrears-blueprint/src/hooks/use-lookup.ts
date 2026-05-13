import { useQuery } from "@tanstack/react-query";

export type LookupValue = {
  id: number;
  namespace: string;
  value: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
};

const BASE = import.meta.env.BASE_URL;

async function fetchLookup(namespace: string): Promise<LookupValue[]> {
  const res = await fetch(`${BASE}api/settings/lookup?namespace=${namespace}`);
  if (!res.ok) throw new Error("Failed to load lookup");
  const all: LookupValue[] = await res.json();
  return all.filter(v => v.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function useLookup(namespace: string) {
  return useQuery({
    queryKey: ["lookup", namespace],
    queryFn: () => fetchLookup(namespace),
    staleTime: 60_000,
  });
}
