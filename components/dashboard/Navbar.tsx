"use client";

import { FormEvent, useRef } from "react";
import { Bell, CalendarDays, Github, Moon, Search, Sun, UserCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface NavbarProps {
  repoSlug: string;
  autoRefresh: boolean;
  onAutoRefreshChange: (checked: boolean) => void;
  onRepoChange: (repoSlug: string) => void;
}

export function Navbar({ repoSlug, autoRefresh, onAutoRefreshChange, onRepoChange }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRepoChange(inputRef.current?.value.trim() ?? "");
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl">
      <div className="flex min-h-14 flex-wrap items-center gap-3 px-4 py-3 xl:px-5">
        <form onSubmit={handleSubmit} className="flex min-w-64 items-center gap-2 rounded-lg border bg-muted/50 px-3 transition-colors focus-within:border-primary/50">
          <Github className="h-4 w-4 text-muted-foreground" />
          <input
            key={repoSlug}
            ref={inputRef}
            defaultValue={repoSlug}
            placeholder="owner/repo"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" className="text-xs font-semibold text-primary hover:text-primary/80">
            Load
          </button>
        </form>

        <button className="flex h-9 items-center gap-2 rounded-lg border bg-muted/50 px-3 text-sm text-foreground/70 transition-colors hover:bg-muted">
          <CalendarDays className="h-4 w-4" />
          Last 30d
        </button>

        <div className="relative min-w-52 flex-1 md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search commits, PRs, issues..."
            className="h-9 w-full rounded-lg border bg-muted/50 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-colors focus:border-primary/50 focus:bg-background"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground md:inline">Auto refresh</span>
          <Switch checked={autoRefresh} onCheckedChange={onAutoRefreshChange} label="Toggle auto refresh" />
          <Button variant="ghost" size="icon" aria-label="Alerts">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(isDark ? "light" : "dark")}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <UserCircle className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
