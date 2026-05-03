"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, MessageCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSectionData } from "@/hooks/useSectionData";
import { cn } from "@/lib/utils";
import { labelStyle, timeAgo } from "@/lib/section-utils";
import { SectionError, SectionLoader, StatBar } from "./shared";

interface GHLabel { name: string; color: string }
interface GHUser { login: string; avatar_url: string }
interface GHIssue {
  number: number;
  title: string;
  state: string;
  user: GHUser;
  labels: GHLabel[];
  assignees: GHUser[];
  comments: number;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export function IssuesSection({ owner, repo }: { owner: string; repo: string }) {
  const [tab, setTab] = useState<"open" | "closed">("open");
  const { data, isLoading, error } = useSectionData<{ open: GHIssue[]; closed: GHIssue[] }>(owner, repo, "issues");

  if (isLoading) return <SectionLoader />;
  if (error) return <SectionError message={(error as Error).message} />;

  const list = tab === "open" ? (data?.open ?? []) : (data?.closed ?? []);
  const openCount = data?.open.length ?? 0;
  const withLabel = data?.open.filter((i) => i.labels.length > 0).length ?? 0;
  const unassigned = data?.open.filter((i) => i.assignees.length === 0).length ?? 0;

  return (
    <div className="space-y-3">
      <StatBar stats={[
        { label: "Open Issues", value: openCount, color: "text-red-500", icon: <AlertTriangle className="h-4 w-4" /> },
        { label: "Unassigned", value: unassigned, color: "text-amber-500", icon: <XCircle className="h-4 w-4" /> },
        { label: "Labelled", value: withLabel, color: "text-blue-500", icon: <CheckCircle2 className="h-4 w-4" /> },
        { label: "Closed (recent)", value: data?.closed.length ?? 0, color: "text-emerald-500", icon: <CheckCircle2 className="h-4 w-4" /> },
      ]} />

      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
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
              <p className="py-8 text-center text-sm text-muted-foreground">No {tab} issues</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Author</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Labels</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Assignees</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                      <MessageCircle className="ml-auto h-3.5 w-3.5" />
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {list.map((issue) => (
                    <tr key={issue.number} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <a href={issue.html_url} target="_blank" rel="noreferrer"
                          className="font-mono font-bold text-sky-500 hover:underline">
                          #{issue.number}
                        </a>
                      </td>
                      <td className="max-w-xs px-4 py-2.5">
                        <a href={issue.html_url} target="_blank" rel="noreferrer"
                          className="line-clamp-1 font-semibold text-foreground hover:text-primary hover:underline">
                          {issue.title}
                        </a>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <img src={issue.user.avatar_url} alt={issue.user.login} width={20} height={20} className="rounded-full ring-1 ring-border" />
                          <span className="text-muted-foreground">{issue.user.login}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {issue.labels.slice(0, 3).map((l) => {
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
                        <div className="flex -space-x-1">
                          {issue.assignees.slice(0, 3).map((a) => (
                            <img key={a.login} src={a.avatar_url} alt={a.login} width={20} height={20}
                              className="rounded-full ring-1 ring-border" title={a.login} />
                          ))}
                          {issue.assignees.length === 0 && <span className="text-[11px] text-muted-foreground">–</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{issue.comments}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{timeAgo(issue.updated_at)}</td>
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
