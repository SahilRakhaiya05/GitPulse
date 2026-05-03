"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, GitMerge, GitPullRequest, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSectionData } from "@/hooks/useSectionData";
import { cn } from "@/lib/utils";
import { labelStyle, timeAgo } from "@/lib/section-utils";
import { SectionError, SectionLoader, StatBar } from "./shared";

interface GHLabel { name: string; color: string }
interface GHUser { login: string; avatar_url: string }
interface GHPR {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  user: GHUser;
  labels: GHLabel[];
  created_at: string;
  updated_at: string;
  comments: number;
  review_comments: number;
  head: { ref: string };
  base: { ref: string };
  html_url: string;
  requested_reviewers: GHUser[];
}

export function PullRequestsSection({ owner, repo }: { owner: string; repo: string }) {
  const [tab, setTab] = useState<"open" | "closed">("open");
  const { data, isLoading, error } = useSectionData<{ open: GHPR[]; closed: GHPR[] }>(owner, repo, "pulls");

  if (isLoading) return <SectionLoader />;
  if (error) return <SectionError message={(error as Error).message} />;

  const list = tab === "open" ? (data?.open ?? []) : (data?.closed ?? []);
  const openCount = data?.open.length ?? 0;
  const draftCount = data?.open.filter((p) => p.draft).length ?? 0;
  const readyCount = openCount - draftCount;

  return (
    <div className="space-y-3">
      <StatBar stats={[
        { label: "Open", value: openCount, color: "text-emerald-500", icon: <GitPullRequest className="h-4 w-4" /> },
        { label: "Draft", value: draftCount, color: "text-slate-400", icon: <Circle className="h-4 w-4" /> },
        { label: "Ready to merge", value: readyCount, color: "text-blue-500", icon: <GitMerge className="h-4 w-4" /> },
        { label: "Closed", value: data?.closed.length ?? 0, color: "text-muted-foreground", icon: <XCircle className="h-4 w-4" /> },
      ]} />

      <Card>
        <CardHeader>
          <CardTitle>Pull Requests</CardTitle>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {(["open", "closed"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors",
                  tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {t} {t === "open" ? `(${openCount})` : `(${data?.closed.length ?? 0})`}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {list.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No {tab} pull requests</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Author</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Labels</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Branch</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Comments</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {list.map((pr) => (
                    <tr key={pr.number} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <a href={pr.html_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 font-mono font-bold text-sky-500 hover:underline">
                          {pr.draft
                            ? <Circle className="h-3.5 w-3.5 text-slate-400" />
                            : <GitPullRequest className="h-3.5 w-3.5 text-emerald-500" />}
                          #{pr.number}
                        </a>
                      </td>
                      <td className="max-w-xs px-4 py-2.5">
                        <a href={pr.html_url} target="_blank" rel="noreferrer"
                          className="line-clamp-1 font-semibold text-foreground hover:text-primary hover:underline">
                          {pr.title}
                        </a>
                        {pr.draft && <span className="ml-1 text-[10px] text-muted-foreground">[Draft]</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <img src={pr.user.avatar_url} alt={pr.user.login} width={20} height={20} className="rounded-full ring-1 ring-border" />
                          <span className="text-muted-foreground">{pr.user.login}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {pr.labels.slice(0, 3).map((l) => {
                            const s = labelStyle(l.color);
                            return (
                              <span key={l.name} className="rounded-full border px-1.5 py-0.5 text-[10px] font-semibold"
                                style={{ background: s.background, color: s.color, borderColor: s.color + "44" }}>
                                {l.name}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <code className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono text-muted-foreground">{pr.head.ref}</code>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{pr.comments + pr.review_comments}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{timeAgo(pr.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
