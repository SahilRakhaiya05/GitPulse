"use client";

import {
  Activity,
  Box,
  Code2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Github,
  LayoutDashboard,
  Package,
  Rocket,
  Shield,
  Tag,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Activity", icon: Activity },
  { label: "Pull Requests", icon: GitPullRequest, count: "512" },
  { label: "Issues", icon: XCircle, count: "6.1K" },
  { label: "Code", icon: Code2 },
  { label: "Commits", icon: GitCommitHorizontal },
  { label: "Branches", icon: GitBranch, count: "184" },
  { label: "Releases", icon: Tag, count: "142" },
  { label: "Security", icon: Shield },
  { label: "Deployments", icon: Rocket },
  { label: "Packages", icon: Package }
];

export function Sidebar({ collapsed, onToggle, repoSlug }: { collapsed: boolean; onToggle: () => void; repoSlug: string }) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden border-r bg-background/95 backdrop-blur xl:block",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <Github className="h-6 w-6 text-foreground" />
        {!collapsed ? <span className="text-sm font-semibold text-foreground">GitHub Enterprise</span> : null}
        <Button className="ml-auto" variant="ghost" size="icon" onClick={onToggle} aria-label="Toggle sidebar">
          <Box className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Github className="h-5 w-5 text-foreground" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{repoSlug.replace("/", " / ")}</p>
                <Badge className="text-[10px]">Public</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Visual Studio Code</p>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="space-y-0.5 p-3">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = index === 0;
          return (
            <button
              key={item.label}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-primary dark:bg-primary/15"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
              {!collapsed && item.count ? (
                <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="absolute bottom-0 w-full space-y-3 border-t p-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Data freshness</span>
            <span className="font-medium text-emerald-500">Live</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-1.5 w-11/12 rounded-full bg-emerald-500" />
          </div>
        </div>
      ) : null}
    </aside>
  );
}
