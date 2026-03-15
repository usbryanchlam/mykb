# Phase 1: Auth + Landing Page — Tasks

> **Deliverable:** User can sign in via Auth0 (if allowlisted), see empty dashboard, sign out.

## Prerequisites (Manual — Auth0 Dashboard)

| #   | Task                               | Details                                                                   |
| --- | ---------------------------------- | ------------------------------------------------------------------------- |
| 1   | Create Auth0 application           | Regular Web Application, configure callback/logout/origin URLs            |
| 2   | Create Auth0 API                   | Identifier: `https://mykb.bryanlam.dev/api`, RS256 signing                |
| 3   | Enable Google Social Connection    | Link Google OAuth credentials, enable for MyKB app                        |
| 4   | Create email allowlist Action      | Post-login Action that denies non-allowlisted emails                      |
| 5   | Create roles                       | `admin`, `editor`, `viewer` in User Management > Roles                    |
| 6   | Create "Add Roles to Token" Action | Post-login Action adding roles to `https://mykb.bryanlam.dev/roles` claim |
| 7   | Assign yourself `admin` role       | User Management > Users > Roles tab                                       |

## PR Stack

```
main
 └── phase1/api-auth0-migration         # PR 1: Database + Auth0 middleware + user sync
      └── phase1/web-auth0-setup         # PR 2: Next.js Auth0 SDK + auth routes
           └── phase1/landing-page       # PR 3: Landing page + theme toggle
                └── phase1/dashboard-shell   # PR 4: Dashboard layout with sidebar
                     └── phase1/auth-tests   # PR 5: Auth tests
```

---

## PR 1: `phase1/api-auth0-migration` — Database + Auth0 JWT middleware + user sync

**Goal:** Replace scaffolded AdonisJS auth with Auth0 JWT verification, align User model with shared types.

| #   | Task                         | Details                                                                                                                                                     |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Delete scaffold auth files   | `auth_middleware.ts`, `silent_auth_middleware.ts`, `user.ts` validators, `config/auth.ts`, `config/session.ts`, `config/shield.ts`, access_tokens migration |
| 2   | Remove auth packages         | Uninstall `@adonisjs/auth`, `@adonisjs/session`, `@adonisjs/shield`                                                                                         |
| 3   | Add `jose` dependency        | JWT verification via JWKS                                                                                                                                   |
| 4   | Update users migration       | Remove `full_name`/`password`, add `auth0_sub` (unique), `name`, `avatar_url`, `role` (default `'viewer'`), `last_login_at`                                 |
| 5   | Update User model            | Extend `BaseModel` directly, declare fields matching shared `User` type, import `UserRole` from `@mykb/shared`                                              |
| 6   | Create `auth0_middleware.ts` | Verify Bearer JWT via `jose` + JWKS, extract claims, upsert user by `auth0_sub`, attach to `ctx.auth0User`                                                  |
| 7   | Create `role_middleware.ts`  | Hierarchical role check using `ROLE_HIERARCHY` from `@mykb/shared`                                                                                          |
| 8   | Create `users_controller.ts` | `me()` action returning authenticated user                                                                                                                  |
| 9   | Add `GET /api/me` route      | Protected by `auth0` middleware                                                                                                                             |
| 10  | Update `kernel.ts`           | Remove session/shield/auth middleware, register `auth0` and `role` named middleware                                                                         |
| 11  | Update `env.ts`              | Add `AUTH0_ISSUER_BASE_URL` and `AUTH0_AUDIENCE` validation, remove `SESSION_DRIVER`                                                                        |
| 12  | Update `adonisrc.ts`         | Remove session/shield/auth providers and commands                                                                                                           |
| 13  | Update exception handler     | Return consistent `{ success, data, error }` envelope                                                                                                       |
| 14  | Update test bootstrap        | Remove `sessionApiClient`/`authApiClient` plugins                                                                                                           |
| 15  | Verify                       | `pnpm turbo build lint` passes, API starts, `/health` works, `/api/me` returns 401 without token                                                            |

**Estimated files:** ~20

---

## PR 2: `phase1/web-auth0-setup` — Next.js Auth0 SDK + auth routes

**Goal:** Add Auth0 authentication to the frontend with route protection and API client.

| #   | Task                       | Details                                                                         |
| --- | -------------------------- | ------------------------------------------------------------------------------- |
| 1   | Add `@auth0/nextjs-auth0`  | Verify Next.js 16 compatibility (v4 SDK for App Router)                         |
| 2   | Create `src/lib/auth0.ts`  | Auth0Client singleton configuration                                             |
| 3   | Create Auth0 route handler | `src/app/api/auth/[auth0]/route.ts` — login, logout, callback                   |
| 4   | Create auth provider       | `src/providers/auth-provider.tsx` — wraps `UserProvider` from SDK               |
| 5   | Update root layout         | Wrap children with auth provider                                                |
| 6   | Create `useAuth` hook      | `src/hooks/use-auth.ts` — wraps `useUser()`, extracts role from claims          |
| 7   | Create Next.js middleware  | `src/middleware.ts` — redirect unauthenticated users from `/dashboard/*` to `/` |
| 8   | Create API client          | `src/lib/api-client.ts` — fetch wrapper attaching Auth0 access token            |
| 9   | Create constants           | `src/lib/constants.ts` — API base URL, Auth0 namespace                          |
| 10  | Verify                     | Auth0 login/logout flow works, `/api/auth/login` redirects to Auth0             |

**Estimated files:** ~10

---

## PR 3: `phase1/landing-page` — Landing page with Auth0 sign-in + theme toggle

**Goal:** Update landing page with real Auth0 sign-in and add dark/light mode support.

| #   | Task                                      | Details                                                              |
| --- | ----------------------------------------- | -------------------------------------------------------------------- |
| 1   | Update `src/app/page.tsx`                 | Real Auth0 login link, redirect to `/dashboard` if authenticated     |
| 2   | Create `src/components/layout/header.tsx` | Landing page header with logo + sign-in button                       |
| 3   | Create theme provider                     | `src/providers/theme-provider.tsx` — dark/light mode context         |
| 4   | Create theme toggle                       | `src/components/layout/theme-toggle.tsx` — switch component          |
| 5   | Create auth layout                        | `src/app/(auth)/layout.tsx` — centered, no sidebar                   |
| 6   | Verify                                    | Landing page renders, sign-in redirects to Auth0, theme toggle works |

**Estimated files:** ~6

---

## PR 4: `phase1/dashboard-shell` — Dashboard layout with sidebar

**Goal:** Create the authenticated dashboard shell that users see after sign-in.

| #   | Task                    | Details                                                                                              |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Create dashboard layout | `src/app/(dashboard)/layout.tsx` — sidebar + header wrapper                                          |
| 2   | Create dashboard page   | `src/app/(dashboard)/page.tsx` — empty state ("No bookmarks yet")                                    |
| 3   | Create sidebar          | `src/components/layout/sidebar.tsx` — nav links (All, Favorites, Archive, Collections, Tags, Search) |
| 4   | Create sidebar nav item | `src/components/layout/sidebar-nav.tsx` — individual nav link component                              |
| 5   | Create dashboard header | `src/components/layout/dashboard-header.tsx` — top bar with user info                                |
| 6   | Create user menu        | `src/components/layout/user-menu.tsx` — dropdown with avatar, name, sign out                         |
| 7   | Create loading skeleton | `src/app/(dashboard)/loading.tsx` — loading state for dashboard                                      |
| 8   | Add skeleton component  | `src/components/ui/skeleton.tsx` — Shadcn skeleton (if not installed)                                |
| 9   | Update landing page     | Redirect authenticated users to `/dashboard`                                                         |
| 10  | Verify                  | Sign in → dashboard with sidebar, user menu shows name/avatar, sign out works                        |

**Estimated files:** ~10

---

## PR 5: `phase1/auth-tests` — Tests for auth flow

**Goal:** Add tests for auth middleware, role checks, and frontend auth components.

| #   | Task                     | Details                                                               |
| --- | ------------------------ | --------------------------------------------------------------------- |
| 1   | Create test auth helper  | `tests/helpers/auth.ts` — generate mock JWTs with configurable claims |
| 2   | Test auth0 middleware    | Unit tests: valid JWT, missing token, expired token, invalid audience |
| 3   | Test role middleware     | Unit tests: admin access, viewer denied, missing user                 |
| 4   | Test `/api/me` endpoint  | Functional test: returns user profile with valid JWT, 401 without     |
| 5   | Test `useAuth` hook      | Frontend unit test: extracts user and role                            |
| 6   | Test route middleware    | Frontend test: unauthenticated redirect                               |
| 7   | Test user menu component | Component test: renders avatar, name, sign out button                 |
| 8   | Verify                   | All tests pass, coverage meets 80% threshold                          |

**Estimated files:** ~8

---

## Final Verification (after full stack merges)

- [ ] `pnpm turbo build` — all 3 packages compile
- [ ] `pnpm turbo lint` — no lint errors
- [ ] `pnpm format:check` — all files formatted
- [ ] `pnpm turbo dev` — both apps start (`:3000` + `:3333`)
- [ ] Visit `localhost:3000` — landing page with "Sign in with Google"
- [ ] Click sign in — redirects to Auth0 hosted login
- [ ] After Google OAuth — redirected to `/dashboard` with empty shell
- [ ] Sidebar shows navigation links
- [ ] User menu shows avatar, name, sign out
- [ ] `GET /api/me` returns authenticated user profile
- [ ] Sign out returns to landing page
- [ ] Unauthenticated visit to `/dashboard` redirects to `/`
