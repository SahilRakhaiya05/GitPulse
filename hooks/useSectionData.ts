"use client";

import { useQuery } from "@tanstack/react-query";

export function useSectionData<T>(owner: string, repo: string, type: string, enabled = true) {
  return useQuery<T>({
    queryKey: ["github-section", owner, repo, type],
    queryFn: async () => {
      const res = await fetch(
        `/api/github/section?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&type=${type}`
      );
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Failed to load data");
      }
      return res.json() as Promise<T>;
    },
    enabled,
    staleTime: 60_000,
    retry: 1
  });
}
