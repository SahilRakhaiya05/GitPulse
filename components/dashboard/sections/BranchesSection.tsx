"use client";

import { GitBranch, Lock, Star, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSectionData } from "@/hooks/useSectionData";
import { shortSha } from "@/lib/section-utils";
import { SectionError, SectionLoader, StatBar } from "./shared";

interface GHBranch {
  name: string;
  protected: boolean;
  commit: { sha: string; url: string };
}

interface BranchData {
  branches: GHBranch[];
  defaultBranch: string;
}

export function BranchesSection({ owner, repo }: { owner: string; repo: string }) {
  const { data, isLoading, error } = useSectionData<BranchData>(owner, repo, "branches");

  if (isLoading) return <SectionLoader />;
  if (error) return <SectionError message={(error as Error).message} />;

  const branches = data?.branches ?? [];
  const protectedCount = branches.filter((b) => b.protected).length;
  const defaultBranch = data?.defaultBranch ?? "main";

  return (
    <div className="space-y-3">
      <StatBar stats={[
        { label: "Total Branches", value: branches.length, color: "text-emerald-500", icon: <GitBranch className="h-4 w-4" /> },
        { label: "Protected", value: protectedCount, color: "text-blue-500", icon: <Lock className="h-4 w-4" /> },
        { label: "Unprotected", value: branches.length - protectedCount, color: "text-amber-500", icon: <Unlock className="h-4 w-4" /> },
        { label: "Default Branch", value: defaultBranch, color: "text-purple-500", icon: <Star className="h-4 w-4" /> },
      ]} />

      <Card>
        <CardHeader><CardTitle>All Branches</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Branch</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Last Commit</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {/* Default branch first */}
                {[...branches].sort((a, b) => {
                  if (a.name === defaultBranch) return -1;
                  if (b.name === defaultBranch) return 1;
                  return a.name.localeCompare(b.name);
                }).map((branch) => (
                  <tr key={branch.name} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{branch.name}</span>
                        {branch.name === defaultBranch && (
                          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">default</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`https://github.com/${owner}/${repo}/commit/${branch.commit.sha}`}
                        target="_blank" rel="noreferrer"
                        className="font-mono text-sky-500 hover:underline">{shortSha(branch.commit.sha)}</a>
                    </td>
                    <td className="px-4 py-3">
                      {branch.protected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                          <Lock className="h-3 w-3" /> Protected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          <Unlock className="h-3 w-3" /> Unprotected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
