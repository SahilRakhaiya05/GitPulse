# GitPulse

<img width="1919" height="860" alt="GitPulse" src="https://github.com/user-attachments/assets/b626d6f5-f22f-487e-a654-4904fb457cc0" />

---
A professional GitHub analytics dashboard for teams that want a clear, modern view of repository health, delivery flow, and activity trends. GitPulse is built with Next.js App Router, TypeScript, Tailwind CSS, TanStack Query, Recharts, and a compact component system, and it is designed to feel like a real product you can launch, extend, and grow over time.

## Product Summary

GitPulse turns GitHub repository data into a polished command-center style dashboard. It presents the information that teams usually check across multiple tools in one place: commits, pull requests, contributors, releases, issues, languages, operational signals, and current repository health.

The experience is intentionally structured for future expansion. The current version already works end-to-end, and the codebase is organized so you can keep pushing more features later without having to rebuild the foundation.

## What It Includes

- A clean enterprise-style dashboard with a responsive 12-column layout
- Collapsible sidebar navigation and repository switching in the top bar
- Auto-refresh support for live data updates
- KPI cards, line charts, pie charts, bar charts, and operational summary panels
- Recent commits, contributors, releases, pipeline status, dependency signals, and activity feed
- Public repository support out of the box
- Optional authenticated access for private repositories through GitHub tokens
- GraphQL-first fetching with REST fallback when needed
- Demo data fallback so the interface still loads cleanly even when GitHub access is limited

## Quick Start

```bash
npm install
npm run dev
```

Then open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

The root route redirects to `/dashboard`, so that is the primary entry point.

## Configuration

If you want authenticated GitHub access, create a `.env.local` file in the project root:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

Guidance:

- Public repositories work without a token.
- Private repositories require a valid token with repository read access.
- A token also improves rate limits for public repository requests.

## Repository Input

The dashboard defaults to `microsoft/vscode`, but you can swap in any repository in `owner/repo` format:

```text
vercel/next.js
facebook/react
openai/openai-node
```

You can also open a specific repository directly:

```text
http://localhost:3000/dashboard?repo=vercel/next.js
```

Invalid repository input is validated before requests are sent.

## Data Flow

The app uses a simple and maintainable data path:

- `app/dashboard/page.tsx` renders the dashboard UI.
- `hooks/useGithubData.ts` handles client-side fetching and auto-refresh.
- `app/api/github/route.ts` validates requests and exposes the API endpoint.
- `lib/github.ts` fetches GitHub data and derives dashboard-ready metrics.

Some values, such as coverage, pipeline status, DORA metrics, dependency summaries, and deployment counts, are derived operational indicators based on repository activity. They are meant to provide useful signal, not to claim direct access to every CI/CD system.

## Project Layout

```text
app/
	api/github/route.ts   Server API for GitHub data
	dashboard/page.tsx    Main dashboard page
components/             Layout, cards, tables, and UI primitives
hooks/useGithubData.ts  Data fetching and refresh behavior
lib/github.ts           GitHub integration and metric derivation
lib/api/mock-data.ts    Fallback demo dataset
types/github.ts         Shared types for dashboard data
```

## Scripts

```bash
npm run dev        # Start the development server
npm run build      # Create a production build
npm run start      # Run the production server
npm run lint       # Lint the codebase
npm run typecheck  # Run TypeScript checks
```

## Launch Checklist

Before treating the app as ready to ship, run:

```bash
npm run typecheck
npm run build
```

If you are using a GitHub token, also test both a public repo and a private repo before publishing.

## Roadmap

Planned next steps for this project typically include:

- Saved repository profiles and presets
- More detailed activity drill-down views
- Better export and sharing options
- Additional org-level analytics screens
- Stronger deployment and environment awareness

## Troubleshooting

- If GitHub requests fail, verify `GITHUB_TOKEN` and confirm it has the right access.
- If the dashboard falls back to demo-like data, the GitHub request likely failed or was rate-limited.
- If a repository name is rejected, confirm it follows the `owner/repo` pattern.
