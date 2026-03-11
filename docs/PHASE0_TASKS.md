# Phase 0: Project Scaffolding — Tasks

> **Deliverable:** Monorepo builds and both apps start with `turbo dev`.

## PR Stack

```
main
 └── chore/monorepo-init              # PR 1: Turborepo + pnpm workspace
      └── chore/shared-package         # PR 2: Shared types and constants
           └── chore/api-scaffold      # PR 3: AdonisJS backend
                └── chore/web-scaffold # PR 4: Next.js frontend
                     └── chore/lint-format-hooks  # PR 5: Linting + formatting + CI
```

---

## PR 1: `chore/monorepo-init` — Turborepo + pnpm workspace

**Goal:** Initialize the monorepo structure so all subsequent PRs have a foundation to build on.

| # | Task | Details |
|---|------|---------|
| 1 | Initialize root `package.json` | `"private": true`, `"packageManager": "pnpm@..."`, workspace scripts (`dev`, `build`, `lint`, `test`, `typecheck`) |
| 2 | Create `pnpm-workspace.yaml` | Define `apps/*` and `packages/*` workspaces |
| 3 | Create `turbo.json` | Configure pipeline: `build` (depends on `^build`), `dev` (persistent), `lint`, `test`, `typecheck` |
| 4 | Create root `.gitignore` | `node_modules`, `dist`, `.turbo`, `.env`, `.env.local`, `.next`, `tmp/`, OS files |
| 5 | Create root `.env.example` | Placeholder env vars from PLAN.md Section 9 (no actual secrets) |
| 6 | Create root `tsconfig.json` | Base TypeScript config for project references |
| 7 | Add `LICENSE` | MIT |
| 8 | Verify | `pnpm install` succeeds, `pnpm turbo build` runs (no-op, no apps yet) |

**Estimated size:** ~100 lines

---

## PR 2: `chore/shared-package` — `packages/shared` types and constants

**Goal:** Create the shared package with types and constants used by both apps.

| # | Task | Details |
|---|------|---------|
| 1 | Create `packages/shared/package.json` | Name: `@mykb/shared`, main/types entry points, TypeScript as dev dep |
| 2 | Create `packages/shared/tsconfig.json` | Extends root config, `composite: true`, outDir `dist/` |
| 3 | Create `src/types/api-envelope.ts` | `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError` types |
| 4 | Create `src/types/bookmark.ts` | `Bookmark`, `BookmarkStatus`, `SafetyStatus` types (stubs) |
| 5 | Create `src/types/user.ts` | `User`, `UserRole` types |
| 6 | Create `src/types/collection.ts` | `Collection` type (stub) |
| 7 | Create `src/types/tag.ts` | `Tag` type (stub) |
| 8 | Create `src/types/roles.ts` | Role enum/union: `admin`, `editor`, `viewer` |
| 9 | Create `src/constants/roles.ts` | Role constants and permission mappings |
| 10 | Create `src/constants/job-types.ts` | Job type constants: `scrape`, `content_safety`, `summarize`, `generate_tags` |
| 11 | Create `src/constants/limits.ts` | Pagination defaults, max file size, scrape timeout, etc. |
| 12 | Create `src/index.ts` | Barrel export for all types and constants |
| 13 | Verify | `pnpm turbo build --filter=@mykb/shared` compiles, types are importable |

**Estimated size:** ~200–250 lines

---

## PR 3: `chore/api-scaffold` — AdonisJS backend (`apps/api`)

**Goal:** Scaffold the AdonisJS API app with SQLite configured and a health check endpoint.

| # | Task | Details |
|---|------|---------|
| 1 | Scaffold AdonisJS app | `npm init adonisjs@latest apps/api -- --kit=api` (API starter kit) |
| 2 | Configure `package.json` | Name: `@mykb/api`, add `@mykb/shared` as workspace dependency |
| 3 | Configure `tsconfig.json` | Extend root config, add path alias for `@mykb/shared` |
| 4 | Configure `adonisrc.ts` | Verify providers, commands, preloads are correct |
| 5 | Create `apps/api/.env.example` | API-specific env vars (DB path, Auth0 config, Gemini key placeholders) |
| 6 | Configure SQLite connection | `config/database.ts` — SQLite with WAL mode pragmas from PLAN.md Section 2 |
| 7 | Create health check route | `GET /health` → `{ status: "ok" }` in `start/routes.ts` |
| 8 | Create placeholder directories | `app/controllers/`, `app/models/`, `app/repositories/`, `app/services/`, `app/validators/`, `app/middleware/`, `app/jobs/`, `app/exceptions/` |
| 9 | Verify | `pnpm turbo dev --filter=@mykb/api` starts on `:3333`, health check responds |

**Estimated size:** ~300–400 lines (includes AdonisJS boilerplate)

---

## PR 4: `chore/web-scaffold` — Next.js frontend (`apps/web`)

**Goal:** Scaffold the Next.js app with Tailwind, Shadcn/ui, and a landing page.

| # | Task | Details |
|---|------|---------|
| 1 | Scaffold Next.js app | `npx create-next-app@latest apps/web` with App Router, TypeScript, Tailwind, `src/` directory |
| 2 | Configure `package.json` | Name: `@mykb/web`, add `@mykb/shared` as workspace dependency |
| 3 | Configure `tsconfig.json` | Add path alias for `@mykb/shared` |
| 4 | Install and init Shadcn/ui | `npx shadcn@latest init`, configure `components.json` |
| 5 | Create `apps/web/.env.example` | Frontend env vars (Auth0 config, API base URL placeholders) |
| 6 | Configure `next.config.ts` | API proxy rewrite to `:3333` for local dev, transpile `@mykb/shared` |
| 7 | Create root layout | `src/app/layout.tsx` — HTML shell, font setup, metadata |
| 8 | Create landing page | `src/app/page.tsx` — Simple "MyKB" heading + placeholder sign-in button |
| 9 | Create `not-found.tsx` | Basic 404 page |
| 10 | Create placeholder directories | `src/components/ui/`, `src/hooks/`, `src/lib/`, `src/providers/`, `src/types/` |
| 11 | Verify | `pnpm turbo dev --filter=@mykb/web` starts on `:3000`, landing page renders |

**Estimated size:** ~300–400 lines (includes Next.js/Tailwind boilerplate)

---

## PR 5: `chore/lint-format-hooks` — ESLint + Prettier + Husky + CI

**Goal:** Enforce code quality from day one with linting, formatting, git hooks, and CI.

| # | Task | Details |
|---|------|---------|
| 1 | Install ESLint | Root-level ESLint with TypeScript parser, import ordering rules |
| 2 | Configure ESLint | `eslint.config.mjs` — shared config across workspaces |
| 3 | Install Prettier | Root-level Prettier with consistent formatting rules |
| 4 | Configure Prettier | `.prettierrc` — semi, singleQuote, trailingComma, printWidth |
| 5 | Add `.prettierignore` | `dist/`, `node_modules/`, `.next/`, `.turbo/`, `pnpm-lock.yaml` |
| 6 | Install Husky + lint-staged | `husky init`, configure pre-commit hook |
| 7 | Configure lint-staged | Run ESLint + Prettier on staged files (`.ts`, `.tsx`, `.json`) |
| 8 | Add `lint` scripts | Ensure `pnpm turbo lint` runs ESLint across all workspaces |
| 9 | Add `format` script | `prettier --write` command in root `package.json` |
| 10 | Create `.github/dependabot.yml` | Config from PLAN.md Section 8 |
| 11 | Create `.github/workflows/ci.yml` | Lint + typecheck + test jobs from PLAN.md Section 8 |
| 12 | Verify | `pnpm turbo lint` passes, `pnpm turbo build` passes, Husky hook fires on commit |

**Estimated size:** ~250–350 lines

---

## Final Verification (after full stack merges)

- [ ] `pnpm install` — clean install succeeds
- [ ] `pnpm turbo dev` — both apps start concurrently (`:3000` + `:3333`)
- [ ] `pnpm turbo build` — all 3 packages compile
- [ ] `pnpm turbo lint` — no lint errors
- [ ] Git commit triggers Husky pre-commit hook
