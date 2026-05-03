"use client";

import { useState } from "react";
import { Activity, GitCommitHorizontal, GitMerge, GitPullRequest, Star, Tag, Users, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSectionData } from "@/hooks/useSectionData";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/section-utils";
import { SectionError, SectionLoader, StatBar } from "./shared";

interface GHActor { login: string; avatar_url: string; display_login?: string }
interface GHEvent {
  id: string;
  type: string;
  actor: GHActor;
  created_at: string;
  payload: Record<string, unknown>;
}

function EventIcon({ type }: { type: string }) {
  const cls = "h-3.5 w-3.5";
  if (type === "PushEvent") return <GitCommitHorizontal className={cn(cls, "text-emerald-500")} />;
  if (type === "PullRequestEvent") return <GitPullRequest className={cn(cls, "text-fuchsia-500")} />;
  if (type === "IssuesEvent") return <XCircle className={cn(cls, "text-red-500")} />;
  if (type === "ReleaseEvent") return <Tag className={cn(cls, "text-blue-500")} />;
  if (type === "WatchEvent") return <Star className={cn(cls, "text-amber-500")} />;
  if (type === "ForkEvent") return <GitMerge className={cn(cls, "text-purple-500")} />;
  if (type === "MemberEvent") return <Users className={cn(cls, "text-sky-500")} />;
  return <Activity className={cn(cls, "text-muted-foreground")} />;
}

function describeEvent(event: GHEvent): string {
  const p = event.payload;
  switch (event.type) {
    case "PushEvent": return `pushed ${(p.commits as unknown[])?.length ?? 0} commit(s) to ${String(p.ref ?? "").replace("refs/heads/", "")}`;
    case "PullRequestEvent": return `${String(p.action)} PR #${(p.pull_request as { number?: number })?.number ?? ""}`;
    case "IssuesEvent": return `${String(p.action)} issue #${(p.issue as { number?: number })?.number ?? ""}`;
    case "ReleaseEvent": return `published release ${(p.release as { tag_name?: string })?.tag_name ?? ""}`;
    case "WatchEvent": return "starred the repository";
    case "ForkEvent": return "forked the repository";
    case "CreateEvent": return `created ${String(p.ref_type)} ${p.ref ? `"${String(p.ref)}"` : ""}`;
    case "DeleteEvent": return `deleted ${String(p.ref_type)} "${String(p.ref)}"`;
    case "IssueCommentEvent": return `commented on issue #${(p.issue as { number?: number })?.number ?? ""}`;
    case "PullRequestReviewEvent": return `reviewed PR #${(p.pull_request as { number?: number })?.number ?? ""}`;
    case "MemberEvent": return `${String(p.action)} member ${(p.member as { login?: string })?.login ?? ""}`;
    default: return event.type.replace("Event", "");
  }
}

const EVENT_TYPES = ["All", "PushEvent", "PullRequestEvent", "IssuesEvent", "ReleaseEvent", "WatchEvent", "ForkEvent"];
const TYPE_LABELS: Record<string, string> = {
  PushEvent: "Push", PullRequestEvent: "PR", IssuesEvent: "Issues",
  ReleaseEvent: "Release", WatchEvent: "Star", ForkEvent: "Fork"
};

export function ActivitySection({ owner, repo }: { owner: string; repo: string }) {
  const [filter, setFilter] = useState("All");
  const { data, isLoading, error } = useSectionData<GHEvent[]>(owner, repo, "activity");

  if (isLoading) return <SectionLoader />;
  if (error) return <SectionError message={(error as Error).message} />;

  const events = data ?? [];
  const filtered = filter === "All" ? events : events.filter((e) => e.type === filter);
  const actors = new Set(events.map((e) => e.actor.login)).size;
  const pushes = events.filter((e) => e.type === "PushEvent").length;
  const prs = events.filter((e) => e.type === "PullRequestEvent").length;

  return (
    <div className="space-y-3">
      <StatBar stats={[
        { label: "Total Events", value: events.length, color: "text-emerald-500", icon: <Activity className="h-4 w-4" /> },
        { label: "Unique Contributors", value: actors, color: "text-blue-500", icon: <Users className="h-4 w-4" /> },
        { label: "Pushes", value: pushes, color: "text-purple-500", icon: <GitCommitHorizontal className="h-4 w-4" /> },
        { label: "PR Events", value: prs, color: "text-fuchsia-500", icon: <GitPullRequest className="h-4 w-4" /> },
      ]} />

      <Card>
        <CardHeader>
          <CardTitle>Repository Events</CardTitle>
          <div className="flex flex-wrap items-center gap-1">
            {EVENT_TYPES.map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={cn("rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                  filter === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}>
                {TYPE_LABELS[t] ?? t}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No events</p>
          ) : (
            <div className="divide-y">
              {filtered.map((event) => (
                <div key={event.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
                  <img src={event.actor.avatar_url} alt={event.actor.login} width={28} height={28}
                    className="mt-0.5 shrink-0 rounded-full ring-1 ring-border" />
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                    <EventIcon type={event.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-bold text-foreground">{event.actor.display_login ?? event.actor.login}</span>
                      <span className="ml-1.5 text-muted-foreground">{describeEvent(event)}</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{timeAgo(event.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
