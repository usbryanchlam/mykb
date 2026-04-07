# MyKB

Your personal knowledge base for bookmarking, summarizing, and organizing web content.

**Live demo:** [mykb.bryanlam.dev](https://mykb.bryanlam.dev)

> Demo account: `demo@example.com` / `Demo2026!`

## Why I Built This

MyKB is my first project built entirely with [Claude Code](https://claude.ai/claude-code) — from planning and architecture to implementation and testing. I wanted to build something that solves a real pain point of mine while being fully customizable for my own workflow.

Beyond the product itself, this project is a showcase of how software is being built in the AI era of 2026. Rather than writing every line of code manually, I collaborated with an AI agent through the entire development lifecycle: planning, system design, architecture, and iterative implementation. I chose the technologies and frameworks, provided feedback on the AI-generated system design and implementation plan, and guided every decision along the way.

I steered the project by defining strict rules for implementation: features were broken down horizontally into stacked Pull Requests, unit tests were created in the same PR where applicable, and each PR had to pass lint, tests, and code review before merging. No PR was allowed to break existing functionality or introduce potential risk to the application.

The entire application was built over the course of 3 weeks, totaling roughly 50 hours. This was not vibe coding — letting an AI agent build the application end-to-end without oversight. Instead, I took an iterative approach, building features incrementally and reviewing each step to ensure quality.

## Features

- **Bookmark any URL** — Save links with automatic metadata extraction (title, description, favicon, open graph image)
- **AI Summarization** — Auto-generated 2-3 sentence summaries powered by Google Gemini
- **AI Tagging** — Automatically categorize bookmarks with relevant tags
- **Manual Content Input** — Paste article content manually when scraping fails, with AI processing
- **Reader View** — Clean, distraction-free reading with adjustable font size
- **Collections** — Organize bookmarks into named groups
- **Smart Lists** — Dynamic filtered views based on tags, favorites, dates, and more
- **Full-text Search** — Search across titles, descriptions, and content
- **Content Safety** — Automatic URL and content safety checks
- **Favorites and Archive** — Star important bookmarks, archive ones you're done with
- **Dark Mode** — Full dark theme support
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer      | Technology                                                                   |
| ---------- | ---------------------------------------------------------------------------- |
| Frontend   | [Next.js](https://nextjs.org) (React, TypeScript)                            |
| Backend    | [AdonisJS](https://adonisjs.com) (TypeScript)                                |
| Database   | SQLite with [Lucid ORM](https://lucid.adonisjs.com)                          |
| Auth       | [Auth0](https://auth0.com) with Google OAuth                                 |
| AI         | [Google Gemini](https://ai.google.dev) (summarization + tagging)             |
| Styling    | [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Monorepo   | [Turborepo](https://turbo.build) + [pnpm](https://pnpm.io) workspaces        |
| Deployment | OCI VM, [Caddy](https://caddyserver.com), [PM2](https://pm2.keymetrics.io)   |

## Project Structure

```
mykb/
├── apps/
│   ├── api/          # AdonisJS backend (REST API, jobs, AI services)
│   └── web/          # Next.js frontend (dashboard, components, actions)
├── packages/
│   └── shared/       # Shared types and constants
├── infra/            # Caddyfile, PM2 config, setup script
├── docs/             # Phase docs, deployment guide
└── .github/          # CI and deploy workflows
```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Auth0 account (for authentication)
- Google Gemini API key (for AI features, optional)

### Setup

```bash
# Clone the repository
git clone https://github.com/usbryanchlam/mykb.git
cd mykb

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit both files with your Auth0 and API credentials

# Generate an app key
cd apps/api && node ace generate:key && cd ../..
# Copy the output into APP_KEY in apps/api/.env

# Run database migrations
cd apps/api && node ace migration:run && cd ../..

# Start development servers
pnpm dev
```

The API runs on `http://localhost:3333` and the web app on `http://localhost:3000`.

## Testing

```bash
# Run all tests
pnpm test

# Run API tests only
pnpm --filter @mykb/api test

# Run web tests only
pnpm --filter @mykb/web test
```

Current test coverage: **371+ tests** (217 API, 154 web).

## Deployment

MyKB is deployed on an OCI VM with Caddy and PM2. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full deployment guide.

Deployments are triggered manually via GitHub Actions workflow.

## Acknowledgments

- Architecture and feature design informed by studying the [Karakeep](https://github.com/karakeep-app/karakeep) codebase — a self-hostable bookmark-everything app with AI features. Karakeep's monorepo structure, content processing pipeline, and AI integration patterns were key references during the planning phase.

## License

MIT
