import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://api.github.com";

async function ghFetch<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    next: { revalidate: 60 }
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("GitHub token expired. Update GITHUB_TOKEN in .env.local.");
    if (res.status === 403) throw new Error("Rate limited or insufficient permissions.");
    if (res.status === 404) throw new Error("Repository not found.");
    throw new Error(`GitHub API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner") ?? "microsoft";
  const repo  = searchParams.get("repo")  ?? "vscode";
  const type  = searchParams.get("type")  ?? "pulls";
  const token = process.env.GITHUB_TOKEN;

  const base = `/repos/${owner}/${repo}`;

  try {
    switch (type) {
      case "pulls": {
        const [open, closed] = await Promise.all([
          ghFetch<unknown[]>(`${base}/pulls?state=open&per_page=30&sort=updated&direction=desc`, token),
          ghFetch<unknown[]>(`${base}/pulls?state=closed&per_page=10&sort=updated&direction=desc`, token).catch(() => [])
        ]);
        return NextResponse.json({ open, closed });
      }

      case "issues": {
        const raw = await ghFetch<Array<{ pull_request?: object }>>(`${base}/issues?state=open&per_page=50&sort=updated`, token);
        const open = raw.filter((i) => !i.pull_request);
        const closed = await ghFetch<Array<{ pull_request?: object }>>(`${base}/issues?state=closed&per_page=20&sort=updated`, token)
          .then((r) => r.filter((i) => !i.pull_request))
          .catch(() => []);
        return NextResponse.json({ open, closed });
      }

      case "commits": {
        const since = new Date();
        since.setDate(since.getDate() - 90);
        const commits = await ghFetch<unknown[]>(`${base}/commits?per_page=50&since=${since.toISOString()}`, token);
        return NextResponse.json(commits);
      }

      case "branches": {
        const branches = await ghFetch<unknown[]>(`${base}/branches?per_page=30`, token);
        const repoMeta = await ghFetch<{ default_branch: string; size: number; pushed_at: string }>(`${base}`, token);
        return NextResponse.json({ branches, defaultBranch: repoMeta.default_branch });
      }

      case "releases": {
        const releases = await ghFetch<unknown[]>(`${base}/releases?per_page=20`, token);
        return NextResponse.json(releases);
      }

      case "activity": {
        const events = await ghFetch<unknown[]>(`${base}/events?per_page=30`, token);
        return NextResponse.json(events);
      }

      case "deployments": {
        const [deployments, runs] = await Promise.all([
          ghFetch<unknown[]>(`${base}/deployments?per_page=20`, token).catch(() => []),
          ghFetch<{ workflow_runs: unknown[] }>(`${base}/actions/runs?per_page=20`, token).catch(() => ({ workflow_runs: [] }))
        ]);
        return NextResponse.json({ deployments, runs: runs.workflow_runs });
      }

      case "security": {
        const alerts = await ghFetch<unknown[]>(`${base}/dependabot/alerts?per_page=30&state=open`, token).catch(() => []);
        const advisories = await ghFetch<unknown[]>(`${base}/security-advisories`, token).catch(() => []);
        return NextResponse.json({ alerts, advisories });
      }

      case "code": {
        const [languages, topics, meta] = await Promise.all([
          ghFetch<Record<string, number>>(`${base}/languages`, token),
          ghFetch<{ names: string[] }>(`${base}/topics`, token).catch(() => ({ names: [] })),
          ghFetch<{
            size: number; stargazers_count: number; forks_count: number;
            open_issues_count: number; default_branch: string; license: { name: string } | null;
            created_at: string; pushed_at: string; description: string | null;
            subscribers_count?: number; network_count?: number;
          }>(`${base}`, token)
        ]);
        return NextResponse.json({ languages, topics: topics.names, meta });
      }

      case "packages": {
        // GitHub packages API requires org-level token; return empty for now
        return NextResponse.json([]);
      }

      default:
        return NextResponse.json({ message: "Unknown section" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub API error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
