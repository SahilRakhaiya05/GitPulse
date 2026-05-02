"use client";

import { useQuery } from "@tanstack/react-query";
import type { GithubDashboardData } from "@/types/github";

interface GithubDataOptions {
  owner: string;
  repo: string;
  autoRefresh: boolean;
}

export function useGithubData({ owner, repo, autoRefresh }: GithubDataOptions) {
  return useQuery({
    queryKey: ["github-dashboard", owner, repo],
    queryFn: async () => {
      const response = await fetch(`/api/github?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to load GitHub analytics.");
      }
      return response.json() as Promise<GithubDashboardData>;
    },
    refetchInterval: autoRefresh ? 60_000 : false
  });
}
