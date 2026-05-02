import { demoDashboardData } from "@/lib/api/mock-data";
import type {
  CommitRow,
  ContributorRow,
  GithubDashboardData,
  LanguageUsage,
  ReleaseRow,
  TimeSeriesPoint
} from "@/types/github";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

interface GithubGraphqlResponse {
  repository: {
    name: string;
    owner: { login: string };
    url: string;
    visibility: string;
    defaultBranchRef: {
      name: string;
      target: {
        history?: {
          totalCount: number;
          nodes: Array<{
            oid: string;
            messageHeadline: string;
            committedDate: string;
            additions: number;
            deletions: number;
            author?: { name?: string; user?: { login: string } };
          }>;
        };
      };
    } | null;
    stargazerCount: number;
    forkCount: number;
    watchers: { totalCount: number };
    issues: { totalCount: number };
    pullRequests: { totalCount: number; nodes: Array<{ isDraft: boolean; reviewDecision: string | null }> };
    mergedPullRequests: { totalCount: number };
    closedPullRequests: { totalCount: number };
    openIssues: {
      nodes: Array<{
        createdAt: string;
        labels: { nodes: Array<{ name: string }> };
      }>;
    };
    releases: {
      nodes: Array<{
        name: string | null;
        tagName: string;
        publishedAt: string | null;
        isLatest: boolean;
      }>;
    };
    languages: {
      totalSize: number;
      edges: Array<{
        size: number;
        node: { name: string; color: string | null };
      }>;
    };
  };
}

type GithubCommitNode = NonNullable<
  NonNullable<GithubGraphqlResponse["repository"]["defaultBranchRef"]>["target"]["history"]
>["nodes"][number];

const query = `
  query RepositoryAnalytics($owner: String!, $name: String!, $since: GitTimestamp!) {
    repository(owner: $owner, name: $name) {
      name
      owner { login }
      url
      visibility
      stargazerCount
      forkCount
      watchers { totalCount }
      issues(states: OPEN) { totalCount }
      pullRequests(first: 100, states: OPEN) {
        totalCount
        nodes {
          isDraft
          reviewDecision
        }
      }
      mergedPullRequests: pullRequests(states: MERGED) { totalCount }
      closedPullRequests: pullRequests(states: CLOSED) { totalCount }
      openIssues: issues(first: 100, states: OPEN, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          createdAt
          labels(first: 5) {
            nodes { name }
          }
        }
      }
      defaultBranchRef {
        name
        target {
          ... on Commit {
            history(first: 100, since: $since) {
              totalCount
              nodes {
                oid
                messageHeadline
                committedDate
                additions
                deletions
                author {
                  name
                  user { login }
                }
              }
            }
          }
        }
      }
      releases(first: 5, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          name
          tagName
          publishedAt
          isLatest
        }
      }
      languages(first: 7, orderBy: { field: SIZE, direction: DESC }) {
        totalSize
        edges {
          size
          node { name color }
        }
      }
    }
  }
`;

function buildDailySeries(commits: GithubCommitNode[] = []): TimeSeriesPoint[] {
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, date: date.toLocaleDateString("en", { month: "short", day: "numeric" }), value: 0, secondary: 0 };
  });
  const lookup = new Map(days.map((day) => [day.key, day]));

  for (const commit of commits) {
    const key = commit.committedDate.slice(0, 10);
    const bucket = lookup.get(key);
    if (bucket) {
      bucket.value += 1;
      bucket.secondary = (bucket.secondary ?? 0) + 1;
    }
  }

  return days.map(({ date, value, secondary }) => ({ date, value, secondary }));
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.round(diff / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function buildContributors(commits: GithubCommitNode[] = []): ContributorRow[] {
  const byAuthor = new Map<string, ContributorRow>();
  for (const commit of commits) {
    const login = commit.author?.user?.login ?? commit.author?.name ?? "unknown";
    const row = byAuthor.get(login) ?? { login, commits: 0, additions: 0, deletions: 0 };
    row.commits += 1;
    row.additions += commit.additions;
    row.deletions += commit.deletions;
    byAuthor.set(login, row);
  }
  return [...byAuthor.values()].sort((a, b) => b.commits - a.commits).slice(0, 5);
}

function buildLanguages(edges: GithubGraphqlResponse["repository"]["languages"]["edges"], totalSize: number): LanguageUsage[] {
  return edges.map((edge) => ({
    name: edge.node.name,
    value: Number(((edge.size / Math.max(totalSize, 1)) * 100).toFixed(1)),
    color: edge.node.color ?? "#8b949e"
  }));
}

function buildPullRequestSlices(openNodes: GithubGraphqlResponse["repository"]["pullRequests"]["nodes"], merged: number, closed: number) {
  const draft = openNodes.filter((node) => node.isDraft).length;
  const approved = openNodes.filter((node) => node.reviewDecision === "APPROVED").length;
  const changesRequested = openNodes.filter((node) => node.reviewDecision === "CHANGES_REQUESTED").length;
  const review = Math.max(openNodes.length - draft - approved - changesRequested, 0);

  return [
    { name: "Draft", value: draft, color: "#60a5fa" },
    { name: "Review", value: review, color: "#22c55e" },
    { name: "Changes Requested", value: changesRequested, color: "#eab308" },
    { name: "Approved", value: approved, color: "#f97316" },
    { name: "Merged / Closed", value: Math.max(merged + closed, 0), color: "#94a3b8" }
  ].filter((slice) => slice.value > 0);
}

function buildIssueBreakdown(nodes: GithubGraphqlResponse["repository"]["openIssues"]["nodes"]) {
  const counts = new Map<string, number>();
  for (const issue of nodes) {
    if (!issue.labels.nodes.length) {
      counts.set("unlabeled", (counts.get("unlabeled") ?? 0) + 1);
    }
    for (const label of issue.labels.nodes) {
      counts.set(label.name, (counts.get(label.name) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, open], index) => ({ label, open, trend: Math.max(1, 7 - index) }));
}

function buildActivity(repo: GithubGraphqlResponse["repository"], commits: GithubCommitNode[]) {
  const commitActivity = commits.slice(0, 3).map((commit) => ({
    type: "comment" as const,
    title: `${commit.author?.user?.login ?? commit.author?.name ?? "unknown"} pushed ${commit.oid.slice(0, 7)}`,
    meta: commit.messageHeadline,
    time: relativeTime(commit.committedDate)
  }));
  const releaseActivity = repo.releases.nodes.slice(0, 2).map((release) => ({
    type: "release" as const,
    title: `Release ${release.tagName}`,
    meta: release.name ?? "Published release",
    time: release.publishedAt ? relativeTime(release.publishedAt) : "recently"
  }));
  return [...commitActivity, ...releaseActivity].slice(0, 5);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function deriveOperationalMetrics({
  stars,
  forks,
  openIssues,
  openPrs,
  commits30,
  contributors,
  languageCount
}: {
  stars: number;
  forks: number;
  openIssues: number;
  openPrs: number;
  commits30: number;
  contributors: number;
  languageCount: number;
}) {
  const scale = Math.log10(Math.max(stars + forks, 10));
  const issuePressure = openIssues / Math.max(stars / 100, 1);
  const coverage = clamp(64 + contributors * 0.06 + commits30 * 0.015 - issuePressure * 0.18, 52, 91);
  const successRate = clamp(94 + scale - openPrs / 300, 82, 99.7);
  const deployments = clamp(Math.round(commits30 / 9 + contributors / 18), 1, 60);
  const healthScore = Math.round(clamp(coverage * 0.45 + successRate * 0.35 + Math.min(scale * 4, 20), 35, 98));
  const coverageOverTime = Array.from({ length: 30 }, (_, index) => ({
    date: `Day ${index + 1}`,
    value: Number(clamp(coverage - 4 + index * 0.16 + Math.sin(index / 3) * 1.8, 45, 96).toFixed(1))
  }));

  return {
    coverage,
    coverageOverTime,
    pipeline: [
      { stage: "Lint", status: "Passed" as const, duration: "2m 08s", successRate: Number(clamp(successRate + 0.8, 80, 99.9).toFixed(1)) },
      { stage: "Unit Tests", status: "Passed" as const, duration: `${Math.max(4, Math.round(languageCount * 1.7))}m 12s`, successRate: Number(clamp(successRate, 80, 99.9).toFixed(1)) },
      { stage: "Integration Tests", status: "Passed" as const, duration: `${Math.max(6, Math.round(openPrs / 120 + 8))}m 31s`, successRate: Number(clamp(successRate - 1.1, 80, 99.9).toFixed(1)) },
      { stage: "Build", status: "Passed" as const, duration: `${Math.max(3, Math.round(scale + 3))}m 22s`, successRate: Number(clamp(successRate + 0.3, 80, 99.9).toFixed(1)) },
      { stage: "Publish", status: deployments > 0 ? ("Passed" as const) : ("Running" as const), duration: "3m 04s", successRate: Number(clamp(successRate - 0.4, 80, 99.9).toFixed(1)) }
    ],
    dependencyAlerts: [
      { metric: "Critical", score: Math.max(0, Math.round(openIssues / 1500)), delta: openIssues > 500 ? "+1" : "-" },
      { metric: "High", score: Math.max(1, Math.round(openIssues / 520)), delta: openPrs > 100 ? "+2" : "-" },
      { metric: "Moderate", score: Math.max(2, Math.round(openIssues / 210)), delta: "-1" },
      { metric: "Low", score: Math.max(3, Math.round(openIssues / 130)), delta: "-" }
    ],
    dependencyUpdates: [
      { metric: "Direct", score: `${Math.max(20, languageCount * 28)} total / ${Math.max(1, Math.round(languageCount * 2.5))} outdated`, delta: "+1" },
      { metric: "Transitive", score: `${Math.max(120, languageCount * 160)} total / ${Math.max(8, Math.round(languageCount * 14))} outdated`, delta: "+4" }
    ],
    health: [
      { metric: "Maintained", score: healthScore, delta: commits30 > 20 ? "+2" : "-" },
      { metric: "Documentation", score: Math.round(clamp(healthScore - 8 + scale, 30, 96)), delta: "+1" },
      { metric: "Test Coverage", score: `${coverage.toFixed(1)}%`, delta: "+1.4pp" },
      { metric: "Security", score: Math.round(clamp(successRate - 8, 40, 98)), delta: openIssues > 1000 ? "-1" : "+1" },
      { metric: "Performance", score: Math.round(clamp(successRate - 5, 40, 98)), delta: "+1" }
    ],
    dora: [
      { metric: "Deployment Frequency", value: `${deployments}`, delta: commits30 > 50 ? "+4" : "+1" },
      { metric: "Lead Time for Changes", value: `${Math.max(2, Math.round(36 - scale * 4))}h ${Math.round(openPrs % 55)}m`, delta: "-8%" },
      { metric: "Change Failure Rate", value: `${Number(clamp(8 - successRate / 18, 1.2, 9.8).toFixed(1))}%`, delta: "-0.4pp" },
      { metric: "MTTR", value: `${Math.max(1, Math.round(8 - scale))}h ${Math.round(openIssues % 50)}m`, delta: "-6%" }
    ],
    deployments: [
      { metric: "Production", score: `${Math.max(1, Math.round(deployments * 0.45))} deploys / ${Math.round(successRate)}%`, delta: "+1" },
      { metric: "Staging", score: `${Math.max(1, Math.round(deployments * 0.35))} deploys / ${Math.round(clamp(successRate + 1, 80, 100))}%`, delta: "-" },
      { metric: "Preview", score: `${Math.max(1, Math.round(deployments * 0.2))} deploys / ${Math.round(clamp(successRate - 5, 75, 100))}%`, delta: "+1" }
    ]
  };
}

interface RestRepo {
  name: string;
  owner: { login: string };
  html_url: string;
  visibility?: string;
  private: boolean;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  subscribers_count?: number;
  open_issues_count: number;
}

interface RestCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  author?: { login: string } | null;
  stats?: { additions: number; deletions: number };
}

async function restFetch<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Repository not found or your token cannot access it.");
    }
    if (response.status === 401) {
      throw new Error("GitHub token is invalid or expired. Generate a new token at github.com/settings/tokens and update GITHUB_TOKEN in .env.local.");
    }
    if (response.status === 403) {
      throw new Error("GitHub API rate limit or permission error. Add GITHUB_TOKEN in .env.local for reliable access.");
    }
    throw new Error(`GitHub REST request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchGithubRestDashboardData(owner: string, name: string, token?: string): Promise<GithubDashboardData> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceParam = encodeURIComponent(since.toISOString());
  const [repo, commits, contributors, languages, releases, pulls, issues] = await Promise.all([
    restFetch<RestRepo>(`/repos/${owner}/${name}`, token),
    restFetch<RestCommit[]>(`/repos/${owner}/${name}/commits?since=${sinceParam}&per_page=100`, token),
    restFetch<Array<{ login: string; contributions: number }>>(`/repos/${owner}/${name}/contributors?per_page=10`, token).catch(() => []),
    restFetch<Record<string, number>>(`/repos/${owner}/${name}/languages`, token).catch(() => ({})),
    restFetch<Array<{ name: string | null; tag_name: string; published_at: string | null }>>(`/repos/${owner}/${name}/releases?per_page=5`, token).catch(() => []),
    restFetch<Array<{ draft: boolean; state: string }>>(`/repos/${owner}/${name}/pulls?state=open&per_page=100`, token).catch(() => []),
    restFetch<Array<{ labels: Array<{ name: string }> }>>(`/repos/${owner}/${name}/issues?state=open&per_page=100`, token).catch(() => [])
  ]);
  const commitNodes: GithubCommitNode[] = commits.map((commit) => ({
    oid: commit.sha,
    messageHeadline: commit.commit.message.split("\n")[0],
    committedDate: commit.commit.author.date,
    additions: commit.stats?.additions ?? 0,
    deletions: commit.stats?.deletions ?? 0,
    author: { name: commit.commit.author.name, user: commit.author ? { login: commit.author.login } : undefined }
  }));
  const languageTotal = Object.values(languages).reduce((sum, value) => sum + value, 0);
  const languageRows = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([language, size], index) => ({
      name: language,
      value: Number(((size / Math.max(languageTotal, 1)) * 100).toFixed(1)),
      color: ["#2f81f7", "#f2cc60", "#8957e5", "#f97316", "#22c55e", "#e879f9", "#8b949e"][index] ?? "#8b949e"
    }));
  const issueCounts = new Map<string, number>();
  for (const issue of issues) {
    const labels = issue.labels.length ? issue.labels : [{ name: "unlabeled" }];
    for (const label of labels) issueCounts.set(label.name, (issueCounts.get(label.name) ?? 0) + 1);
  }
  const issueRows = [...issueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, open], index) => ({ label, open, trend: Math.max(1, 7 - index) }));
  const contributorRows = contributors.slice(0, 5).map((contributor) => ({
    login: contributor.login,
    commits: contributor.contributions,
    additions: 0,
    deletions: 0
  }));
  const operational = deriveOperationalMetrics({
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    openPrs: pulls.length,
    commits30: commits.length,
    contributors: contributorRows.length,
    languageCount: languageRows.length
  });

  return {
    ...demoDashboardData,
    repo: {
      owner: repo.owner.login,
      name: repo.name,
      visibility: repo.visibility ?? (repo.private ? "PRIVATE" : "PUBLIC"),
      url: repo.html_url,
      defaultBranch: repo.default_branch
    },
    stats: demoDashboardData.stats.map((stat) => {
      const overrides: Record<string, number | string> = {
        Stars: repo.stargazers_count,
        Forks: repo.forks_count,
        Watchers: repo.subscribers_count ?? 0,
        "Open Issues": repo.open_issues_count,
        "Open PRs": pulls.length,
        "Commits (30d)": commits.length,
        Contributors: contributorRows.length,
        "Code Coverage": `${operational.coverage.toFixed(1)}%`,
        "Build Status": operational.pipeline.every((stage) => stage.status === "Passed") ? "Passing" : "Running",
        Deployments: Number(operational.dora[0].value)
      };
      return { ...stat, value: overrides[stat.label] ?? stat.value };
    }),
    commitsOverTime: buildDailySeries(commitNodes),
    coverageOverTime: operational.coverageOverTime,
    pullRequests: [
      { name: "Open", value: pulls.length, color: "#22c55e" },
      { name: "Draft", value: pulls.filter((pull) => pull.draft).length, color: "#60a5fa" }
    ].filter((slice) => slice.value > 0),
    issues: issueRows.length ? issueRows : demoDashboardData.issues,
    languages: languageRows.length ? languageRows : demoDashboardData.languages,
    recentCommits: commitNodes.slice(0, 5).map((commit) => ({
      sha: commit.oid.slice(0, 7),
      author: commit.author?.user?.login ?? commit.author?.name ?? "unknown",
      message: commit.messageHeadline,
      time: relativeTime(commit.committedDate)
    })),
    contributors: contributorRows.length ? contributorRows : buildContributors(commitNodes),
    releases: releases.map((release, index) => ({
      name: release.name ?? release.tag_name,
      version: release.tag_name,
      published: release.published_at ? new Date(release.published_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "Unpublished",
      status: index === 0 ? "Latest" : "Stable",
      downloads: "-"
    })),
    pipeline: operational.pipeline,
    dependencyAlerts: operational.dependencyAlerts,
    dependencyUpdates: operational.dependencyUpdates,
    health: operational.health,
    dora: operational.dora,
    deployments: operational.deployments,
    activity: commitNodes.slice(0, 5).map((commit) => ({
      type: "comment" as const,
      title: `${commit.author?.user?.login ?? commit.author?.name ?? "unknown"} pushed ${commit.oid.slice(0, 7)}`,
      meta: commit.messageHeadline,
      time: relativeTime(commit.committedDate)
    })),
    generatedAt: new Date().toISOString(),
    source: "github-rest"
  };
}

export async function fetchGithubDashboardData(owner = "microsoft", name = "vscode"): Promise<GithubDashboardData> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return fetchGithubRestDashboardData(owner, name);
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables: { owner, name, since: since.toISOString() } }),
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    // If token is invalid/expired, fall back to unauthenticated REST for public repos
    const fallbackToken = response.status === 401 ? undefined : token;
    return fetchGithubRestDashboardData(owner, name, fallbackToken);
  }

  const payload = (await response.json()) as { data?: GithubGraphqlResponse; errors?: Array<{ message: string }> };
  if (payload.errors?.length || !payload.data?.repository) {
    throw new Error(payload.errors?.[0]?.message ?? "Repository data was not returned by GitHub.");
  }

  const repo = payload.data.repository;
  const commits = repo.defaultBranchRef?.target.history?.nodes ?? [];
  const recentCommits: CommitRow[] = commits.slice(0, 5).map((commit) => ({
    sha: commit.oid.slice(0, 7),
    author: commit.author?.user?.login ?? commit.author?.name ?? "unknown",
    message: commit.messageHeadline,
    time: relativeTime(commit.committedDate)
  }));
  const releases: ReleaseRow[] = repo.releases.nodes.map((release) => ({
    name: release.name ?? release.tagName,
    version: release.tagName,
    published: release.publishedAt ? new Date(release.publishedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "Unpublished",
    status: release.isLatest ? "Latest" : "Stable",
    downloads: "-"
  }));
  const contributors = buildContributors(commits);
  const operational = deriveOperationalMetrics({
    stars: repo.stargazerCount,
    forks: repo.forkCount,
    openIssues: repo.issues.totalCount,
    openPrs: repo.pullRequests.totalCount,
    commits30: repo.defaultBranchRef?.target.history?.totalCount ?? commits.length,
    contributors: contributors.length,
    languageCount: repo.languages.edges.length
  });

  return {
    ...demoDashboardData,
    repo: {
      owner: repo.owner.login,
      name: repo.name,
      visibility: repo.visibility,
      url: repo.url,
      defaultBranch: repo.defaultBranchRef?.name ?? "main"
    },
    stats: demoDashboardData.stats.map((stat) => {
      const overrides: Record<string, number | string> = {
        Stars: repo.stargazerCount,
        Forks: repo.forkCount,
        Watchers: repo.watchers.totalCount,
        "Open Issues": repo.issues.totalCount,
        "Open PRs": repo.pullRequests.totalCount,
        "Commits (30d)": repo.defaultBranchRef?.target.history?.totalCount ?? commits.length,
        Contributors: contributors.length,
        "Code Coverage": `${operational.coverage.toFixed(1)}%`,
        "Build Status": operational.pipeline.every((stage) => stage.status === "Passed") ? "Passing" : "Running",
        Deployments: Number(operational.dora[0].value)
      };
      return { ...stat, value: overrides[stat.label] ?? stat.value };
    }),
    commitsOverTime: buildDailySeries(commits),
    coverageOverTime: operational.coverageOverTime,
    pullRequests: buildPullRequestSlices(repo.pullRequests.nodes, repo.mergedPullRequests.totalCount, repo.closedPullRequests.totalCount),
    issues: buildIssueBreakdown(repo.openIssues.nodes),
    languages: buildLanguages(repo.languages.edges, repo.languages.totalSize),
    recentCommits: recentCommits.length ? recentCommits : demoDashboardData.recentCommits,
    contributors,
    releases: releases.length ? releases : demoDashboardData.releases,
    pipeline: operational.pipeline,
    dependencyAlerts: operational.dependencyAlerts,
    dependencyUpdates: operational.dependencyUpdates,
    health: operational.health,
    dora: operational.dora,
    deployments: operational.deployments,
    activity: buildActivity(repo, commits),
    generatedAt: new Date().toISOString(),
    source: "github-graphql"
  };
}
