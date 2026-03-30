# MyKB — Implementation Plan

## Overview

MyKB is a personal knowledge base web application for bookmarking, summarizing, and organizing web content. It uses a Turborepo monorepo with a Next.js frontend and AdonisJS API backend, backed by SQLite with FTS5 full-text search, Google Gemini for AI features, and Auth0 for authentication. Designed for 2-3 users on an Oracle OCI free-tier ARM VM.

---

## Tech Stack

| Decision    | Choice                                                          |
| ----------- | --------------------------------------------------------------- |
| Frontend    | Next.js (latest) + React + Tailwind + Shadcn/ui                 |
| Backend     | AdonisJS (latest)                                               |
| ORM         | Lucid (AdonisJS built-in)                                       |
| Database    | SQLite (better-sqlite3) + WAL mode                              |
| AI          | Google Gemini API                                               |
| Auth        | Auth0 (Google OAuth + email allowlist via Actions + RBAC)       |
| Roles       | Admin, Editor, Viewer                                           |
| Search      | SQLite FTS5                                                     |
| Infra       | Oracle OCI free tier, single ARM VM                             |
| Assets      | OCI Object Storage                                              |
| Domain      | mykb.bryanlam.dev                                               |
| SSL         | Let's Encrypt (Caddy)                                           |
| Repo        | Monorepo (Turborepo)                                            |
| CI/CD       | GitHub Actions                                                  |
| PR Workflow | Graphite (stacked PRs) — see [PR_PRACTICE.md](./PR_PRACTICE.md) |

---

## Architecture

```
mykb.bryanlam.dev
        |
      Caddy (SSL + reverse proxy)
       / \
      /   \
Next.js    AdonisJS API
:3000      :3333
             |
     +-------+-------+-------+
     |       |       |       |
  SQLite   OCI     Gemini  Auth0
  (WAL)  Storage    API
```

---

## 1. Project Structure

```
mykb/
├── .github/
│   ├── dependabot.yml                # Automated dependency updates + security fixes
│   └── workflows/
│       ├── ci.yml                    # Lint + test on PR
│       └── deploy.yml                # Deploy on merge to main
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   └── logo.svg
│   │   ├── src/
│   │   │   ├── app/                  # App Router
│   │   │   │   ├── api/auth/[auth0]/
│   │   │   │   │   └── route.ts      # Auth0 dynamic route handler
│   │   │   │   ├── (auth)/
│   │   │   │   │   └── login/
│   │   │   │   │       └── page.tsx   # Landing + "Sign in with Google" via Auth0
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx              # Dashboard home (all bookmarks)
│   │   │   │   │   ├── favorites/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── archive/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── collections/
│   │   │   │   │   │   ├── page.tsx          # List all collections
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx      # Single collection
│   │   │   │   │   ├── smart-lists/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── bookmarks/
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── page.tsx      # Bookmark detail / reader view
│   │   │   │   │   │       └── edit/
│   │   │   │   │   │           └── page.tsx
│   │   │   │   │   ├── tags/
│   │   │   │   │   │   ├── page.tsx          # Browse all tags
│   │   │   │   │   │   └── [slug]/
│   │   │   │   │   │       └── page.tsx      # Bookmarks by tag
│   │   │   │   │   ├── search/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── admin/
│   │   │   │   │       └── page.tsx          # Admin dashboard (links to Auth0 Dashboard)
│   │   │   │   ├── layout.tsx                # Root layout (providers, theme)
│   │   │   │   ├── page.tsx                  # Landing/welcome page
│   │   │   │   └── not-found.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/                       # Shadcn/ui components (auto-generated)
│   │   │   │   ├── layout/
│   │   │   │   │   ├── header.tsx
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── footer.tsx
│   │   │   │   │   └── theme-toggle.tsx
│   │   │   │   ├── bookmarks/
│   │   │   │   │   ├── bookmark-card.tsx
│   │   │   │   │   ├── bookmark-list.tsx
│   │   │   │   │   ├── bookmark-grid.tsx
│   │   │   │   │   ├── add-bookmark-dialog.tsx
│   │   │   │   │   ├── bookmark-actions.tsx
│   │   │   │   │   └── reader-view.tsx
│   │   │   │   ├── tags/
│   │   │   │   │   ├── tag-badge.tsx
│   │   │   │   │   ├── tag-input.tsx
│   │   │   │   │   └── tag-list.tsx
│   │   │   │   ├── collections/
│   │   │   │   │   ├── collection-card.tsx
│   │   │   │   │   └── create-collection-dialog.tsx
│   │   │   │   ├── search/
│   │   │   │   │   ├── search-bar.tsx
│   │   │   │   │   └── search-results.tsx
│   │   │   │   └── admin/
│   │   │   │       └── admin-overview.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-bookmarks.ts
│   │   │   │   ├── use-collections.ts
│   │   │   │   ├── use-tags.ts
│   │   │   │   ├── use-search.ts
│   │   │   │   ├── use-auth.ts
│   │   │   │   └── use-debounce.ts
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts             # Typed fetch wrapper for AdonisJS API
│   │   │   │   ├── constants.ts
│   │   │   │   └── utils.ts
│   │   │   ├── providers/
│   │   │   │   ├── auth-provider.tsx
│   │   │   │   ├── theme-provider.tsx
│   │   │   │   └── query-provider.tsx        # TanStack Query
│   │   │   └── types/
│   │   │       ├── bookmark.ts
│   │   │       ├── collection.ts
│   │   │       ├── tag.ts
│   │   │       ├── user.ts
│   │   │       └── api.ts                    # API envelope types
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── api/                          # AdonisJS backend
│       ├── app/
│       │   ├── controllers/
│       │   │   ├── bookmarks_controller.ts
│       │   │   ├── collections_controller.ts
│       │   │   ├── tags_controller.ts
│       │   │   ├── search_controller.ts
│       │   │   ├── smart_lists_controller.ts
│       │   │   └── users_controller.ts       # User profile (synced from Auth0)
│       │   ├── models/
│       │   │   ├── user.ts
│       │   │   ├── bookmark.ts
│       │   │   ├── tag.ts
│       │   │   ├── collection.ts
│       │   │   ├── smart_list.ts
│       │   │   ├── bookmark_tag.ts
│       │   │   ├── bookmark_collection.ts
│       │   │   └── job_log.ts
│       │   ├── repositories/
│       │   │   ├── base_repository.ts        # Abstract base with CRUD
│       │   │   ├── bookmark_repository.ts
│       │   │   ├── collection_repository.ts
│       │   │   ├── tag_repository.ts
│       │   │   ├── smart_list_repository.ts
│       │   │   └── user_repository.ts
│       │   ├── services/
│       │   │   ├── bookmark_service.ts
│       │   │   ├── scraper_service.ts        # Metadata extraction + Readability
│       │   │   ├── content_safety_service.ts # URL reputation + AI content safety
│       │   │   ├── ai_service.ts             # Gemini summarization + tagging
│       │   │   ├── storage_service.ts        # OCI Object Storage uploads
│       │   │   ├── search_service.ts         # FTS5 queries
│       │   │   └── job_service.ts            # In-process job queue
│       │   ├── validators/
│       │   │   ├── bookmark_validator.ts
│       │   │   ├── collection_validator.ts
│       │   │   ├── tag_validator.ts
│       │   │   └── smart_list_validator.ts
│       │   ├── middleware/
│       │   │   ├── auth0_middleware.ts        # Verify Auth0 JWT, attach user
│       │   │   ├── role_middleware.ts         # Read role from Auth0 JWT claims
│       │   │   └── rate_limit_middleware.ts
│       │   ├── jobs/
│       │   │   ├── job_worker.ts             # In-process queue runner
│       │   │   ├── scrape_bookmark_job.ts
│       │   │   ├── content_safety_job.ts     # URL reputation + content safety check
│       │   │   ├── summarize_bookmark_job.ts
│       │   │   └── generate_tags_job.ts
│       │   └── exceptions/
│       │       ├── handler.ts
│       │       └── domain_exceptions.ts
│       ├── config/
│       │   ├── app.ts
│       │   ├── database.ts
│       │   ├── auth.ts
│       │   ├── cors.ts
│       │   └── storage.ts
│       ├── database/
│       │   ├── migrations/
│       │   │   ├── 001_create_users.ts
│       │   │   ├── 002_create_bookmarks.ts
│       │   │   ├── 003_create_tags.ts
│       │   │   ├── 004_create_bookmark_tags.ts
│       │   │   ├── 005_create_collections.ts
│       │   │   ├── 006_create_bookmark_collections.ts
│       │   │   ├── 007_create_smart_lists.ts
│       │   │   ├── 008_create_job_logs.ts
│       │   │   └── 009_create_fts5_index.ts
│       │   └── seeders/
│       │       └── initial_admin_seeder.ts
│       ├── start/
│       │   ├── routes.ts
│       │   ├── kernel.ts
│       │   └── events.ts
│       ├── tests/
│       │   ├── unit/
│       │   │   ├── services/
│       │   │   └── repositories/
│       │   ├── integration/
│       │   │   ├── controllers/
│       │   │   └── jobs/
│       │   └── helpers/
│       │       ├── test_utils.ts
│       │       └── factories/
│       ├── adonisrc.ts
│       ├── tsconfig.json
│       ├── package.json
│       └── .env.example
│
├── packages/
│   └── shared/                       # Shared types and constants
│       ├── src/
│       │   ├── types/
│       │   │   ├── api-envelope.ts
│       │   │   ├── bookmark.ts
│       │   │   ├── user.ts
│       │   │   ├── collection.ts
│       │   │   ├── tag.ts
│       │   │   └── roles.ts
│       │   ├── constants/
│       │   │   ├── roles.ts
│       │   │   ├── job-types.ts
│       │   │   └── limits.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── infra/
│   ├── Caddyfile                     # Reverse proxy config
│   ├── ecosystem.config.js           # PM2 process manager config
│   └── setup.sh                      # VM bootstrap script
│
├── turbo.json
├── package.json                      # Root workspace config
├── pnpm-workspace.yaml
├── .gitignore
├── .env.example                      # Root env template
└── LICENSE
```

---

## 2. Database Schema

All tables use `INTEGER PRIMARY KEY` (SQLite auto-increment alias). Timestamps are ISO-8601 strings stored as TEXT. SQLite WAL mode is enabled at connection time.

### Table: `users`

| Column        | Type    | Constraints                | Notes                                  |
| ------------- | ------- | -------------------------- | -------------------------------------- | ----- |
| id            | INTEGER | PK, autoincrement          |                                        |
| auth0_sub     | TEXT    | NOT NULL, UNIQUE           | Auth0 subject ID (e.g., `google-oauth2 | 123`) |
| email         | TEXT    | NOT NULL, UNIQUE           | Gmail address (from Auth0 profile)     |
| name          | TEXT    | NOT NULL                   | From Auth0 profile                     |
| avatar_url    | TEXT    | NULLABLE                   | Auth0 profile picture                  |
| role          | TEXT    | NOT NULL, DEFAULT 'viewer' | Synced from Auth0 RBAC roles           |
| last_login_at | TEXT    | NULLABLE                   | ISO-8601                               |
| created_at    | TEXT    | NOT NULL                   |                                        |
| updated_at    | TEXT    | NOT NULL                   |                                        |

**Indexes:** `idx_users_email` on `email`, `idx_users_auth0_sub` on `auth0_sub`

> **Note:** The `allowed_emails` table is no longer needed. Email allowlist and role
> assignment are managed entirely via Auth0 (Actions for allowlist, RBAC for roles).
> User records are created/synced on first API request after Auth0 login.

### Table: `bookmarks`

| Column         | Type    | Constraints                 | Notes                                                 |
| -------------- | ------- | --------------------------- | ----------------------------------------------------- |
| id             | INTEGER | PK, autoincrement           |                                                       |
| user_id        | INTEGER | FK -> users.id, NOT NULL    | Creator                                               |
| url            | TEXT    | NOT NULL                    | Original URL                                          |
| title          | TEXT    | NULLABLE                    | Extracted or manual                                   |
| description    | TEXT    | NULLABLE                    | Meta description or manual                            |
| summary        | TEXT    | NULLABLE                    | AI-generated summary                                  |
| content        | TEXT    | NULLABLE                    | Reader-view cleaned HTML                              |
| plain_text     | TEXT    | NULLABLE                    | Plain text for FTS indexing                           |
| favicon_url    | TEXT    | NULLABLE                    | Site favicon URL                                      |
| og_image_url   | TEXT    | NULLABLE                    | OpenGraph image URL                                   |
| thumbnail_key  | TEXT    | NULLABLE                    | OCI Object Storage key                                |
| screenshot_key | TEXT    | NULLABLE                    | OCI Object Storage key                                |
| is_favorite    | INTEGER | NOT NULL, DEFAULT 0         | Boolean (0/1)                                         |
| is_archived    | INTEGER | NOT NULL, DEFAULT 0         | Boolean (0/1)                                         |
| scrape_status  | TEXT    | NOT NULL, DEFAULT 'pending' | 'pending','processing','completed','failed'           |
| ai_status      | TEXT    | NOT NULL, DEFAULT 'pending' | 'pending','processing','completed','failed','skipped' |
| safety_status  | TEXT    | NOT NULL, DEFAULT 'pending' | 'pending','safe','flagged','skipped'                  |
| safety_reasons | TEXT    | NULLABLE                    | JSON array of flagged reasons                         |
| scrape_error   | TEXT    | NULLABLE                    | Error message if scrape failed                        |
| ai_error       | TEXT    | NULLABLE                    | Error message if AI failed                            |
| created_at     | TEXT    | NOT NULL                    |                                                       |
| updated_at     | TEXT    | NOT NULL                    |                                                       |

**Indexes:**

- `idx_bookmarks_user_id` on `user_id`
- `idx_bookmarks_url` on `(user_id, url)` UNIQUE
- `idx_bookmarks_created_at` on `created_at`
- `idx_bookmarks_favorite` on `(user_id, is_favorite)`
- `idx_bookmarks_archived` on `(user_id, is_archived)`

### Table: `tags`

| Column          | Type    | Constraints              | Notes                 |
| --------------- | ------- | ------------------------ | --------------------- |
| id              | INTEGER | PK, autoincrement        |                       |
| name            | TEXT    | NOT NULL                 | Display name          |
| slug            | TEXT    | NOT NULL                 | URL-safe lowercase    |
| user_id         | INTEGER | FK -> users.id, NOT NULL | Tag owner             |
| is_ai_generated | INTEGER | NOT NULL, DEFAULT 0      | Whether AI created it |
| created_at      | TEXT    | NOT NULL                 |                       |

**Indexes:** `idx_tags_slug` on `(user_id, slug)` UNIQUE

### Table: `bookmark_tags` (join table)

| Column      | Type    | Constraints                           |
| ----------- | ------- | ------------------------------------- |
| bookmark_id | INTEGER | FK -> bookmarks.id, ON DELETE CASCADE |
| tag_id      | INTEGER | FK -> tags.id, ON DELETE CASCADE      |
| created_at  | TEXT    | NOT NULL                              |

**PK:** composite `(bookmark_id, tag_id)`

### Table: `collections`

| Column      | Type    | Constraints              | Notes               |
| ----------- | ------- | ------------------------ | ------------------- |
| id          | INTEGER | PK, autoincrement        |                     |
| user_id     | INTEGER | FK -> users.id, NOT NULL | Owner               |
| name        | TEXT    | NOT NULL                 |                     |
| description | TEXT    | NULLABLE                 |                     |
| icon        | TEXT    | NULLABLE                 | Emoji or icon name  |
| sort_order  | INTEGER | NOT NULL, DEFAULT 0      | For manual ordering |
| created_at  | TEXT    | NOT NULL                 |                     |
| updated_at  | TEXT    | NOT NULL                 |                     |

**Indexes:** `idx_collections_user_id` on `user_id`

### Table: `bookmark_collections` (join table)

| Column        | Type    | Constraints                             |
| ------------- | ------- | --------------------------------------- |
| bookmark_id   | INTEGER | FK -> bookmarks.id, ON DELETE CASCADE   |
| collection_id | INTEGER | FK -> collections.id, ON DELETE CASCADE |
| sort_order    | INTEGER | NOT NULL, DEFAULT 0                     |
| created_at    | TEXT    | NOT NULL                                |

**PK:** composite `(bookmark_id, collection_id)`

### Table: `smart_lists`

| Column       | Type    | Constraints              | Notes                              |
| ------------ | ------- | ------------------------ | ---------------------------------- |
| id           | INTEGER | PK, autoincrement        |                                    |
| user_id      | INTEGER | FK -> users.id, NOT NULL | Owner                              |
| name         | TEXT    | NOT NULL                 |                                    |
| description  | TEXT    | NULLABLE                 |                                    |
| icon         | TEXT    | NULLABLE                 |                                    |
| filter_query | TEXT    | NOT NULL                 | JSON: serialized filter conditions |
| created_at   | TEXT    | NOT NULL                 |                                    |
| updated_at   | TEXT    | NOT NULL                 |                                    |

`filter_query` example: `{"tags":["typescript","react"],"is_favorite":true,"date_range":"last_30_days"}`

### Table: `job_logs`

| Column        | Type    | Constraints                           | Notes                                   |
| ------------- | ------- | ------------------------------------- | --------------------------------------- |
| id            | INTEGER | PK, autoincrement                     |                                         |
| job_type      | TEXT    | NOT NULL                              | 'scrape', 'summarize', 'generate_tags'  |
| bookmark_id   | INTEGER | FK -> bookmarks.id, ON DELETE CASCADE |                                         |
| status        | TEXT    | NOT NULL                              | 'queued','running','completed','failed' |
| error_message | TEXT    | NULLABLE                              |                                         |
| started_at    | TEXT    | NULLABLE                              |                                         |
| completed_at  | TEXT    | NULLABLE                              |                                         |
| created_at    | TEXT    | NOT NULL                              |                                         |

**Indexes:** `idx_job_logs_status` on `status`, `idx_job_logs_bookmark_id` on `bookmark_id`

### FTS5 Virtual Table: `bookmarks_fts`

```sql
CREATE VIRTUAL TABLE bookmarks_fts USING fts5(
  title,
  description,
  summary,
  plain_text,
  tags,              -- space-separated tag names for search
  content='bookmarks',
  content_rowid='id',
  tokenize='porter unicode61'
);
```

Kept in sync via triggers on `bookmarks` INSERT/UPDATE/DELETE and a rebuild trigger when tags change.

### SQLite Pragmas (set at connection)

```sql
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA cache_size = -20000;  -- 20MB cache
```

---

## 3. API Design

All endpoints return the standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": { "total": 100, "page": 1, "limit": 20 }
}
```

### Auth (handled by Auth0 SDK on Next.js side)

| Method | Path                 | Handler               | Description                          |
| ------ | -------------------- | --------------------- | ------------------------------------ |
| GET    | `/api/auth/login`    | `@auth0/nextjs-auth0` | Redirect to Auth0 Universal Login    |
| GET    | `/api/auth/callback` | `@auth0/nextjs-auth0` | Auth0 callback, sets session cookies |
| GET    | `/api/auth/logout`   | `@auth0/nextjs-auth0` | Logout and clear session             |
| GET    | `/api/auth/me`       | `@auth0/nextjs-auth0` | Current user profile + role          |

> Auth routes are handled entirely by the Next.js Auth0 SDK. AdonisJS API validates
> the JWT Access Token from the `Authorization` header on every request.

### Bookmarks

| Method | Path                          | Auth | Role    | Description                                |
| ------ | ----------------------------- | ---- | ------- | ------------------------------------------ |
| GET    | `/api/bookmarks`              | Yes  | Any     | List bookmarks (paginated, filterable)     |
| POST   | `/api/bookmarks`              | Yes  | Editor+ | Create bookmark (triggers scrape job)      |
| GET    | `/api/bookmarks/:id`          | Yes  | Any     | Get bookmark detail                        |
| PATCH  | `/api/bookmarks/:id`          | Yes  | Editor+ | Update bookmark (title, description, etc.) |
| DELETE | `/api/bookmarks/:id`          | Yes  | Editor+ | Soft or hard delete                        |
| PATCH  | `/api/bookmarks/:id/favorite` | Yes  | Editor+ | Toggle favorite                            |
| PATCH  | `/api/bookmarks/:id/archive`  | Yes  | Editor+ | Toggle archive                             |
| POST   | `/api/bookmarks/:id/rescrape` | Yes  | Editor+ | Re-trigger scrape + AI jobs                |
| GET    | `/api/bookmarks/:id/reader`   | Yes  | Any     | Get reader-view content                    |

**Query params for GET `/api/bookmarks`:**
`?page=1&limit=20&sort=created_at&order=desc&is_favorite=true&is_archived=false&tag=slug&collection_id=1&q=search+term`

### Tags

| Method | Path                             | Auth | Role    | Description                             |
| ------ | -------------------------------- | ---- | ------- | --------------------------------------- |
| GET    | `/api/tags`                      | Yes  | Any     | List all tags (with bookmark counts)    |
| POST   | `/api/tags`                      | Yes  | Editor+ | Create tag                              |
| PATCH  | `/api/tags/:id`                  | Yes  | Editor+ | Rename tag                              |
| DELETE | `/api/tags/:id`                  | Yes  | Editor+ | Delete tag (removes from all bookmarks) |
| POST   | `/api/bookmarks/:id/tags`        | Yes  | Editor+ | Add tags to bookmark                    |
| DELETE | `/api/bookmarks/:id/tags/:tagId` | Yes  | Editor+ | Remove tag from bookmark                |

### Collections

| Method | Path                                         | Auth | Role    | Description                       |
| ------ | -------------------------------------------- | ---- | ------- | --------------------------------- |
| GET    | `/api/collections`                           | Yes  | Any     | List collections                  |
| POST   | `/api/collections`                           | Yes  | Editor+ | Create collection                 |
| GET    | `/api/collections/:id`                       | Yes  | Any     | Get collection with bookmarks     |
| PATCH  | `/api/collections/:id`                       | Yes  | Editor+ | Update collection                 |
| DELETE | `/api/collections/:id`                       | Yes  | Editor+ | Delete collection (not bookmarks) |
| POST   | `/api/collections/:id/bookmarks`             | Yes  | Editor+ | Add bookmark to collection        |
| DELETE | `/api/collections/:id/bookmarks/:bookmarkId` | Yes  | Editor+ | Remove bookmark                   |

### Smart Lists

| Method | Path                   | Auth | Role    | Description                         |
| ------ | ---------------------- | ---- | ------- | ----------------------------------- |
| GET    | `/api/smart-lists`     | Yes  | Any     | List smart lists                    |
| POST   | `/api/smart-lists`     | Yes  | Editor+ | Create smart list                   |
| GET    | `/api/smart-lists/:id` | Yes  | Any     | Get smart list + resolved bookmarks |
| PATCH  | `/api/smart-lists/:id` | Yes  | Editor+ | Update smart list                   |
| DELETE | `/api/smart-lists/:id` | Yes  | Editor+ | Delete smart list                   |

### Search

| Method | Path          | Auth | Role | Description                                |
| ------ | ------------- | ---- | ---- | ------------------------------------------ |
| GET    | `/api/search` | Yes  | Any  | FTS5 search with `?q=term&page=1&limit=20` |

### Admin

> User management, email allowlist, and role assignment are handled via the **Auth0
> Dashboard** — no custom admin API endpoints needed. The admin page in the frontend
> provides a link to the Auth0 Dashboard for convenience.

| Method | Path               | Auth | Role  | Description                                                |
| ------ | ------------------ | ---- | ----- | ---------------------------------------------------------- |
| GET    | `/api/admin/stats` | Yes  | Admin | App statistics (bookmark count, storage usage, job status) |

---

## 4. Authentication Flow (Auth0)

### Why Auth0

Auth0 replaces custom OAuth implementation, email allowlist table, session management, and admin allowlist UI — significantly reducing code while adding enterprise-grade auth features (MFA, brute-force protection, anomaly detection) for free.

- **Free tier:** 25,000 MAU (more than enough for 2-3 users)
- **Google Social Connection:** One-click setup in Auth0 Dashboard
- **Email allowlist:** Auth0 Action (post-login) rejects non-allowlisted emails
- **RBAC:** Built-in roles (admin, editor, viewer) with permissions
- **User management:** Auth0 Dashboard (no custom admin UI needed)

### Auth0 Configuration

**Tenant:** `mykb.auth0.com` (or custom domain)
**Application:** Single Page Application (for Next.js)
**API:** `https://mykb.bryanlam.dev/api` (AdonisJS API audience)

**Connections:**

- Google Social Connection (only connection enabled)

**Roles (Auth0 RBAC):**

- `admin` — permissions: `manage:users`
- `editor` — permissions: `write:bookmarks`, `write:tags`, `write:collections`
- `viewer` — permissions: `read:bookmarks`, `read:tags`, `read:collections`

**Auth0 Action (Post-Login — Email Allowlist):**

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const allowedEmails = event.secrets.ALLOWED_EMAILS.split(',')
  if (!allowedEmails.includes(event.user.email)) {
    api.access.deny('Your email is not authorized to access MyKB.')
  }
}
```

The allowlist is managed by editing the `ALLOWED_EMAILS` secret in Auth0 Dashboard. For a more scalable approach, the Action can query Auth0 Management API or an external endpoint.

### Login Flow

```
1. User clicks "Sign in with Google" on landing page
2. Next.js calls Auth0 SDK: handleLogin() with connection='google-oauth2'
3. Auth0 redirects to Google OAuth consent screen
4. User authenticates with Google
5. Auth0 receives Google tokens, runs Post-Login Action:
   - Check email against ALLOWED_EMAILS secret
   - NOT in list -> deny access, show error page
   - IN list -> continue
6. Auth0 issues Access Token (JWT) + ID Token
   - Access Token contains: sub, email, roles, permissions
   - Audience: https://mykb.bryanlam.dev/api
7. Next.js stores tokens in HTTP-only, secure cookies (via @auth0/nextjs-auth0)
8. Redirect to /dashboard
9. Frontend API calls include Access Token in Authorization header
10. AdonisJS validates JWT, extracts user info, syncs to local DB
```

### Token Management

- **Access Token:** JWT, 1 hour expiry, contains roles/permissions in custom claims
- **Refresh Token:** Stored server-side by Auth0 SDK, enables silent refresh
- **ID Token:** User profile info (email, name, avatar)
- **Cookies:** HTTP-only, Secure, SameSite=Lax (managed by `@auth0/nextjs-auth0`)

### Role Enforcement

- `auth0_middleware.ts` — verifies JWT signature against Auth0 JWKS, extracts user claims
- `role_middleware.ts` — reads `roles` claim from JWT, checks against allowed roles
- On first API request: sync Auth0 user to local `users` table (upsert by `auth0_sub`)
- Viewer role: can read everything, cannot create/update/delete
- Editor role: full CRUD on own bookmarks, tags, collections
- Admin role: Editor + user management via Auth0 Dashboard

### Frontend Auth State

- `@auth0/nextjs-auth0` SDK handles login/logout/callback routes
- `UserProvider` wraps the app, provides `useUser()` hook
- Custom `useAuth()` hook extends with role from JWT claims
- Protected routes use Next.js middleware to redirect unauthenticated users
- Components conditionally render based on role

### Auth0 SDK Integration Points

| Component        | SDK                   | Purpose                               |
| ---------------- | --------------------- | ------------------------------------- |
| Next.js frontend | `@auth0/nextjs-auth0` | Login/logout, session, user context   |
| AdonisJS API     | `jwks-rsa` + `jose`   | JWT verification against Auth0 JWKS   |
| Auth0 Dashboard  | —                     | Manage users, roles, allowlist Action |

---

## 5. Background Job Design

### Architecture: In-Process Queue

Since this is a single-server, 2-3 user application, a full job queue (Redis + Bull) is overkill. An in-process async queue is used instead.

```
+---------------------------------------------+
|  AdonisJS Process                            |
|                                              |
|  +----------+    +--------------------+      |
|  | HTTP API |-->| JobService          |      |
|  +----------+   |  - enqueue()        |      |
|                  |  - process()        |      |
|                  |  - concurrency: 2   |      |
|                  +---------+----------+      |
|                            |                 |
|              +-------------+-------------+   |
|              v             v             v   |
|         ScrapeJob   SummarizeJob     TagJob  |
|              |             |             |   |
|              v             v             v   |
|         bookmarks     bookmarks       tags   |
|         (update)      (update)      (create) |
+---------------------------------------------+
```

### Job Pipeline (triggered when a bookmark is created)

```
User adds URL
    |
    v
1. ScrapeBookmarkJob (fetch + extract metadata)
    |
    v
2. ContentSafetyJob (URL reputation + AI content check)
    |
    +-- FLAGGED --> mark safety_status='flagged', STOP pipeline
    |
    +-- SAFE --> continue
    |
    v
3. SummarizeBookmarkJob + GenerateTagsJob (in parallel)
```

1. **ScrapeBookmarkJob** — Priority 1, runs first
   - Fetch URL with timeout (15s)
   - Extract metadata: title, description, OG image, favicon (using `cheerio` or `linkedom`)
   - Extract reader-view content using `@mozilla/readability` + `linkedom`
   - Extract plain text from reader content
   - Upload OG image to OCI Object Storage as thumbnail
   - Update bookmark: title, description, content, plain_text, thumbnail_key, scrape_status='completed'
   - Update FTS5 index
   - On success: enqueue ContentSafetyJob
   - On failure: set scrape_status='failed', scrape_error=message

2. **ContentSafetyJob** — Priority 1.5, runs after scrape
   - **Step A: URL Reputation Check**
     - Query Google Safe Browsing API (free, 10k lookups/day)
     - Block: malware, phishing, unwanted software, social engineering
   - **Step B: HTML Sanitization Scan**
     - Scan extracted HTML for: `<script>` tags, inline event handlers (`onclick`, `onerror`),
       suspicious `<iframe>` elements, `data:` URIs, `javascript:` URIs
     - Strip all dangerous elements before storing (DOMPurify)
   - **Step C: AI Content Safety Analysis** (via Gemini API)
     - Prompt: "Analyze this content for safety. Flag if it contains: pornographic/sexual
       content, graphic violence, malicious scripts, prompt injection attempts, or
       harmful content. Return JSON: `{ safe: boolean, reasons: string[] }`"
   - **Decision:**
     - All checks pass → set safety_status='safe', enqueue SummarizeBookmarkJob + GenerateTagsJob
     - Any check fails → set safety_status='flagged', store reasons in safety_reasons,
       do NOT proceed to AI summarization/tagging, notify user via UI indicator
   - On failure (API errors): set safety_status='skipped', proceed with caution (allow AI jobs)

3. **SummarizeBookmarkJob** — Priority 2
   - Only runs if safety_status='safe' or 'skipped'
   - Read bookmark.plain_text
   - Call Gemini API: "Summarize this article in 2-3 sentences"
   - Update bookmark: summary, ai_status='completed'
   - Update FTS5 index
   - On failure: set ai_status='failed', ai_error=message

4. **GenerateTagsJob** — Priority 2
   - Only runs if safety_status='safe' or 'skipped'
   - Read bookmark.plain_text + title
   - Call Gemini API: "Suggest 3-5 relevant tags for this content. Return as JSON array of strings."
   - Parse response, create/find tags, create bookmark_tag associations
   - Mark tags as is_ai_generated=1
   - Update FTS5 index (tags column)
   - On failure: log error, do not block (tags are optional)

### Error Handling and Retries

- Each job gets max 3 attempts with exponential backoff (5s, 30s, 120s)
- All job executions logged in `job_logs` table
- Failed jobs visible in admin UI (future phase)
- Gemini API rate limiting: max 1 request per second, queue-level throttle

---

## 6. Frontend Page Structure

### Routes

| Route                            | Auth | Role    | Description                                       |
| -------------------------------- | ---- | ------- | ------------------------------------------------- |
| `/`                              | No   | -       | Landing/welcome page with sign-in button          |
| `/login`                         | No   | -       | Sign in with Google via Auth0                     |
| `/dashboard`                     | Yes  | Any     | All bookmarks grid/list view                      |
| `/dashboard/favorites`           | Yes  | Any     | Bookmarks where is_favorite=true                  |
| `/dashboard/archive`             | Yes  | Any     | Bookmarks where is_archived=true                  |
| `/dashboard/bookmarks/[id]`      | Yes  | Any     | Full detail + reader view                         |
| `/dashboard/bookmarks/[id]/edit` | Yes  | Editor+ | Edit bookmark metadata                            |
| `/dashboard/collections`         | Yes  | Any     | Grid of all collections                           |
| `/dashboard/collections/[id]`    | Yes  | Any     | Bookmarks in a collection                         |
| `/dashboard/smart-lists`         | Yes  | Any     | List of smart lists                               |
| `/dashboard/smart-lists/[id]`    | Yes  | Any     | Resolved bookmarks                                |
| `/dashboard/tags`                | Yes  | Any     | Tag cloud / list with counts                      |
| `/dashboard/tags/[slug]`         | Yes  | Any     | Bookmarks with this tag                           |
| `/dashboard/search`              | Yes  | Any     | Full-text search results                          |
| `/dashboard/admin`               | Yes  | Admin   | Admin dashboard (stats + link to Auth0 Dashboard) |

### Key Components

**DashboardLayout** — Sidebar navigation, header with search bar + add bookmark button + user avatar, theme toggle, responsive (sidebar collapses on mobile)

**BookmarkCard** — Thumbnail, title, domain, description snippet, tag badges, quick actions (favorite/archive/delete), AI status indicator, time ago

**AddBookmarkDialog** — Modal with URL input, optional title override + initial tags + collection, processing status after submit

**ReaderView** — Clean article display, AI summary callout at top, AI tags below summary, font size controls, link to original URL

**SearchBar** — Debounced input (300ms), keyboard shortcut Cmd+K / Ctrl+K to focus

### State Management

- **TanStack Query** for server state (bookmarks, collections, tags)
- **React Context** for auth state and theme
- No client-side global store needed

---

## 7. Phase Breakdown

### Phase 0: Project Scaffolding

**Dependencies:** None

1. Initialize Turborepo monorepo with pnpm workspace
2. Scaffold AdonisJS app (`apps/api`) with API starter kit
3. Scaffold Next.js app (`apps/web`) with App Router + Tailwind + Shadcn/ui
4. Create shared package (`packages/shared`) with types and constants
5. Set up linting and formatting (ESLint + Prettier + Husky)

**Deliverable:** Monorepo builds and both apps start with `turbo dev`.

### Phase 1: Auth + Landing Page

**Dependencies:** Phase 0

1. Auth0 tenant setup: create application, configure Google Social Connection
2. Auth0 Action: post-login email allowlist check
3. Auth0 RBAC: create admin, editor, viewer roles with permissions
4. Database migration: `users` table
5. AdonisJS: `auth0_middleware.ts` (JWT verification via JWKS) + `role_middleware.ts`
6. AdonisJS: user sync on first API request (upsert by auth0_sub)
7. Frontend: install + configure `@auth0/nextjs-auth0`
8. Frontend: landing page with "Sign in with Google" button
9. Frontend: auth provider + useAuth hook + protected routes (Next.js middleware)
10. Frontend: dashboard layout shell with sidebar + theme toggle

**Deliverable:** User can sign in via Auth0 (if allowlisted), see empty dashboard, sign out.

### Phase 2: Core Bookmarks

**Dependencies:** Phase 1

1. Database migration: `bookmarks` table
2. Bookmark repository, validator, service, controller, routes
3. Frontend: bookmark grid/list view with pagination
4. Frontend: add bookmark dialog
5. Frontend: bookmark detail page
6. Frontend: favorites and archive pages

**Deliverable:** User can add URLs, see bookmarks in grid/list, favorite/archive/delete. No scraping or AI yet.

### Phase 3: Scraping + Content Safety + Reader View

**Dependencies:** Phase 2

1. In-process job queue with concurrency control and retry logic
2. Scraper service (fetch, parse metadata, Readability extraction)
3. ScrapeBookmarkJob
4. Content safety service (Google Safe Browsing API + HTML sanitization + Gemini safety analysis)
5. ContentSafetyJob (runs after scrape, gates AI jobs)
6. Storage service for OCI Object Storage uploads
7. Wire job trigger on bookmark creation: scrape → safety check → AI jobs
8. Frontend: reader view component (renders DOMPurify-sanitized HTML only)
9. Frontend: scrape status + safety status indicators
10. Frontend: flagged content warning UI (show reason, block reader view for flagged bookmarks)

**Deliverable:** Adding a bookmark triggers metadata extraction + content safety check. Unsafe content is flagged and blocked from reader view. Safe bookmarks proceed to AI processing.

### Phase 4: AI Features

**Dependencies:** Phase 3

1. AI service (Gemini API client with rate limiting)
2. Database migrations: `tags` and `bookmark_tags` tables
3. Tag repository and service (find-or-create pattern)
4. SummarizeBookmarkJob and GenerateTagsJob
5. Wire AI jobs after scrape completion
6. Tags API endpoints
7. Frontend: AI summary display, tag management UI, tags browse page

**Deliverable:** Bookmarks get AI summaries and auto-tags. Manual tag management works.

### Phase 5: Search + Collections + Smart Lists

**Dependencies:** Phase 4

1. FTS5 virtual table setup with sync triggers
2. Search service and API
3. Frontend: search bar (Cmd+K) and results page
4. Database migrations: `collections`, `bookmark_collections`, `smart_lists`
5. Collections CRUD (model, repository, service, controller, routes, UI)
6. Smart lists with filter query builder

**Deliverable:** Full-text search, collections, and smart lists all working.

### Phase 6: Admin + Polish

**Dependencies:** Phase 5

1. Admin dashboard page (app stats, link to Auth0 Dashboard for user/allowlist management)
2. Rate limiting middleware (`@adonisjs/limiter`)
3. Security headers middleware (Helmet: CSP, X-Frame-Options, etc.)
4. Error pages (404, 403, 500)
5. Loading states and skeletons throughout
6. Responsive design pass
7. Favicon and meta tags

**Deliverable:** Admin page links to Auth0. App is polished, responsive, and security-hardened.

### Phase 7: Fit-and-Finish

**Dependencies:** Phase 6

1. Comprehensive manual testing on localhost (desktop + mobile)
2. User-reported UI/UX issues and functional bugs
3. Iterative fixes in focused PRs until quality bar is met

**Deliverable:** Production-quality UI/UX verified through comprehensive manual testing.

### Phase 8: Full Security Assessment

**Dependencies:** Phase 7

1. Authentication & authorization review (Auth0, RBAC, session management)
2. API security (input validation, SQL injection, rate limiting, error leakage)
3. Content security (XSS, SSRF, content safety pipeline)
4. Infrastructure security (headers, secrets, dependency audit)
5. Data protection (user isolation, cascade deletes, sensitive data in logs)

**Deliverable:** All security vulnerabilities identified and remediated before cloud deployment.

### Phase 9: Infrastructure + Deployment

**Dependencies:** Phase 8

1. Caddyfile (reverse proxy: /api/_ -> :3333, /_ -> :3000)
2. PM2 config (manage AdonisJS + Next.js processes)
3. VM setup script (Node.js, pnpm, Caddy, PM2, firewall)
4. GitHub Actions CI (lint, typecheck, test on PR)
5. GitHub Actions Deploy (SSH, pull, build, migrate, restart on merge to main)
6. Environment variable documentation and startup validation

**Deliverable:** App deployed to mykb.bryanlam.dev with automated CI/CD.

---

## 8. CI/CD Pipeline

### CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Setup pnpm + Node.js
      - Install deps (pnpm install --frozen-lockfile)
      - Run: pnpm turbo lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - Checkout, setup, install
      - Run: pnpm turbo typecheck

  test-api:
    runs-on: ubuntu-latest
    steps:
      - Checkout, setup, install
      - Run: pnpm turbo test --filter=@mykb/api
      - Upload coverage report

  test-web:
    runs-on: ubuntu-latest
    steps:
      - Checkout, setup, install
      - Run: pnpm turbo test --filter=@mykb/web
      - Upload coverage report
```

### Deploy Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - SSH into OCI VM via appleboy/ssh-action
      - Commands: cd /opt/mykb
          git pull origin main
          pnpm install --frozen-lockfile
          pnpm turbo build
          cd apps/api && node ace migration:run --force
          pm2 restart ecosystem.config.js
      - Health check: curl https://mykb.bryanlam.dev/api/auth/me (expect 401)
```

### Dependabot (`.github/dependabot.yml`)

Automated dependency updates and security vulnerability remediation.

```yaml
version: 2
updates:
  # Root workspace + shared packages
  - package-ecosystem: 'npm'
    directory: '/'
    cooldown:
      default-days: 7
    schedule:
      interval: 'weekly'
      day: 'monday'
    open-pull-requests-limit: 10
    reviewers:
      - 'usbryanchlam'
    labels:
      - 'dependencies'
    groups:
      # Group minor/patch updates to reduce PR noise
      production-deps:
        patterns:
          - '*'
        update-types:
          - 'minor'
          - 'patch'

  # Next.js frontend
  - package-ecosystem: 'npm'
    directory: '/apps/web'
    cooldown:
      default-days: 7
    schedule:
      interval: 'weekly'
      day: 'monday'
    open-pull-requests-limit: 5
    reviewers:
      - 'usbryanchlam'
    labels:
      - 'dependencies'
      - 'frontend'

  # AdonisJS backend
  - package-ecosystem: 'npm'
    directory: '/apps/api'
    cooldown:
      default-days: 7
    schedule:
      interval: 'weekly'
      day: 'monday'
    open-pull-requests-limit: 5
    reviewers:
      - 'usbryanchlam'
    labels:
      - 'dependencies'
      - 'backend'

  # GitHub Actions
  - package-ecosystem: 'github-actions'
    directory: '/'
    cooldown:
      default-days: 7
    schedule:
      interval: 'weekly'
    labels:
      - 'dependencies'
      - 'ci'
```

**Dependabot security updates** are enabled by default when Dependabot is configured. GitHub will automatically create PRs for known vulnerabilities (CVEs) in dependencies, separate from the scheduled weekly updates.

**7-day cooldown:** Each ecosystem is configured with `cooldown.default-days: 7`. Dependabot will wait 7 days after a new version is published before raising a PR, giving the community time to discover regressions.

**CI integration:** Dependabot PRs trigger the CI workflow (lint, typecheck, test), so broken updates are caught before merge.

---

## 9. Security

### Content Safety Pipeline

When a user adds a URL, the content passes through a multi-layer safety pipeline before AI processing:

| Layer                  | Tool                     | What It Catches                                                                                                      | Cost                                         |
| ---------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1. URL Reputation      | Google Safe Browsing API | Malware, phishing, unwanted software, social engineering                                                             | Free (10k lookups/day)                       |
| 2. HTML Sanitization   | DOMPurify (server-side)  | `<script>` injection, event handlers (`onclick`, `onerror`), suspicious `<iframe>`, `data:` URIs, `javascript:` URIs | Free (library)                               |
| 3. AI Content Analysis | Google Gemini API        | Pornography, graphic violence, prompt injection, harmful content                                                     | Per-token (shared with summarization budget) |

**Decision logic:**

- All layers pass → `safety_status = 'safe'`, proceed to AI summarization + tagging
- Any layer fails → `safety_status = 'flagged'`, store reasons, halt AI pipeline, show warning in UI
- Layer errors (API down) → `safety_status = 'skipped'`, proceed with caution

**Prompt Injection Defense:**

- AI content safety check specifically looks for prompt injection patterns in scraped content
- Scraped content is never used as system prompts — always passed as user content with clear delimiters
- AI responses are validated against expected JSON schema before processing

### Application Security

| Category                | Implementation                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Authentication**      | Auth0 with Google OAuth; JWT validation on every API request via JWKS                                                                                                    |
| **Authorization**       | Auth0 RBAC roles (admin/editor/viewer); `role_middleware.ts` enforces per-endpoint                                                                                       |
| **Input Validation**    | Vine validators on all API inputs; URL format validation (http/https only)                                                                                               |
| **XSS Prevention**      | DOMPurify sanitizes all HTML before storage and rendering; React's built-in escaping                                                                                     |
| **CSRF Protection**     | Auth0 SDK handles via state parameter; SameSite cookie attribute                                                                                                         |
| **SQL Injection**       | Lucid ORM parameterized queries only; no raw string concatenation                                                                                                        |
| **SSRF Prevention**     | Block private/internal IPs when scraping (127.0.0.1, 10.x, 172.16-31.x, 192.168.x, 169.254.x, fd00::/8)                                                                  |
| **Rate Limiting**       | `@adonisjs/limiter` on all endpoints; stricter limits on write operations                                                                                                |
| **Security Headers**    | Helmet middleware: Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy |
| **Secrets Management**  | All secrets in environment variables; validated at AdonisJS startup via `env.ts`; never logged or returned in API responses                                              |
| **Dependency Security** | `npm audit` in CI pipeline; Dependabot for automated updates + security PRs; GitHub security alerts enabled; lock file integrity check                                   |
| **Error Handling**      | Production errors return generic messages; detailed errors logged server-side only; never expose stack traces                                                            |

### Scraper Security

| Measure             | Implementation                                                            |
| ------------------- | ------------------------------------------------------------------------- |
| Request timeout     | 15 seconds max                                                            |
| Response size limit | 10MB max                                                                  |
| Redirect limit      | Max 3 redirects                                                           |
| Scheme restriction  | Only `http://` and `https://` allowed                                     |
| IP blocking         | Block requests to private/loopback/link-local addresses (SSRF prevention) |
| User-Agent          | Identify as MyKB bot (transparent, not deceptive)                         |
| Resource cleanup    | Abort fetch on timeout; close connections                                 |

### Environment Variables (Secrets)

```bash
# Auth0
AUTH0_SECRET                    # Cookie encryption key (>32 chars random)
AUTH0_BASE_URL                  # https://mykb.bryanlam.dev
AUTH0_ISSUER_BASE_URL           # https://mykb.auth0.com
AUTH0_CLIENT_ID                 # Auth0 application client ID
AUTH0_CLIENT_SECRET             # Auth0 application client secret
AUTH0_AUDIENCE                  # https://mykb.bryanlam.dev/api

# AI
GEMINI_API_KEY                  # Google Gemini API key

# Content Safety
GOOGLE_SAFE_BROWSING_API_KEY   # Google Safe Browsing API key

# Storage
OCI_OBJECT_STORAGE_NAMESPACE   # OCI tenancy namespace
OCI_OBJECT_STORAGE_BUCKET      # Bucket name
OCI_ACCESS_KEY                 # OCI access credentials
OCI_SECRET_KEY                 # OCI secret credentials

# App
APP_KEY                         # AdonisJS application key
NODE_ENV                        # production
```

---

## 10. Testing Strategy

### API Tests (`apps/api/tests/`)

**Unit tests** (repositories, services):

- BookmarkRepository: CRUD, pagination, filtering
- ScraperService: metadata extraction (mock HTTP responses)
- ContentSafetyService: URL reputation check, HTML sanitization, AI safety analysis (mock APIs)
- AIService: summarization, tag generation (mock Gemini API)
- SearchService: FTS5 queries
- JobService: queue ordering, concurrency, retries

**Integration tests** (controllers, full request lifecycle):

- Auth: JWT validation, role enforcement (mock Auth0 JWKS)
- Bookmark CRUD: create, read, update, delete with auth
- Role enforcement: viewer cannot create, editor can
- Content safety pipeline: safe URL proceeds, flagged URL halts AI pipeline
- Search: FTS5 indexing and query results

**Test database:** In-memory SQLite or temp file per test suite, migrations run before each suite.

### Web Tests (`apps/web/`)

**Unit tests** (components, hooks):

- BookmarkCard rendering with various states
- AddBookmarkDialog validation
- useAuth hook behavior
- API client error handling

### Coverage Target: 80%+

---

## 11. Risks and Mitigations

| Risk                                                 | Severity | Mitigation                                                                                  |
| ---------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| Web scraping fails on complex sites (SPAs, paywalls) | Medium   | Graceful degradation: show URL-only bookmark, allow manual metadata entry, re-scrape button |
| Gemini API rate limits or outages                    | Medium   | Retry with backoff, mark ai_status='failed', allow manual retry, app works without AI       |
| SQLite write contention under concurrent scrape jobs | Low      | WAL mode + busy_timeout=5000 + max 2 concurrent jobs                                        |
| OCI free tier resource limits                        | Low      | Monitor usage, SQLite is lightweight, asset storage within free tier                        |
| FTS5 index grows large                               | Low      | Personal use scale (thousands, not millions) — FTS5 handles this fine                       |
| Auth0 service outage                                 | Low      | Users remain logged in via cached session; graceful error page if Auth0 is down             |
| Content safety false positives                       | Low      | Flagged bookmarks are not deleted — user can review and override (future feature)           |
| Google Safe Browsing API quota                       | Low      | 10k lookups/day is far beyond personal use; fallback to 'skipped' status if exhausted       |
| Single point of failure (one VM)                     | Medium   | Acceptable for personal use; daily SQLite backup to OCI Object Storage                      |

---

## 12. Success Criteria

- [ ] Landing page loads at mykb.bryanlam.dev with sign-in button
- [ ] Only allowlisted Gmail accounts can authenticate (via Auth0 Action)
- [ ] Admin can manage users and roles via Auth0 Dashboard
- [ ] User can add a URL and see metadata auto-populate within 10 seconds
- [ ] AI summary and auto-tags appear within 30 seconds of adding a bookmark
- [ ] Reader view displays clean article content
- [ ] Full-text search returns relevant results with snippets
- [ ] Bookmarks can be organized into collections and favorited/archived
- [ ] Smart lists correctly filter bookmarks by saved criteria
- [ ] Dark/light theme toggle works correctly
- [ ] All API endpoints validate input and return consistent envelope format
- [ ] Test coverage is 80%+ on API, 80%+ on critical frontend components
- [ ] CI pipeline runs on every PR, deploy pipeline runs on merge to main
- [ ] Content safety pipeline flags unsafe URLs and blocks them from reader view
- [ ] All HTML content is sanitized (no scripts, event handlers, or dangerous elements)
- [ ] Security headers are set correctly (CSP, X-Frame-Options, etc.)
- [ ] App runs reliably on OCI free tier ARM VM
