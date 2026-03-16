# Phase 2: Core Bookmarks — Tasks

> **Deliverable:** User can add URLs, see bookmarks in grid/list, favorite/archive/delete. No scraping or AI yet.

## Dependencies

- Phase 1 complete (auth, dashboard shell)

## PR Stack

```
main
 └── phase2/bookmark-migration        # PR 1: Database migration + model
      └── phase2/bookmark-api          # PR 2: Repository, validator, service, controller, routes
           └── phase2/bookmark-grid    # PR 3: Bookmark grid/list view with pagination
                └── phase2/add-dialog  # PR 4: Add bookmark dialog
                     └── phase2/detail # PR 5: Bookmark detail page
                          └── phase2/favorites-archive  # PR 6: Favorites and archive pages
                               └── phase2/tests  # PR 7: Tests
```

---

## PR 1: `phase2/bookmark-migration` — Database migration + model

**Goal:** Create bookmarks table and Lucid model aligned with shared types.

| #   | Task                       | Details                                                                                                                                                                                                                                                                                  |
| --- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Create bookmarks migration | All columns from PLAN.md Section 2: user_id (FK), url, title, description, summary, content, plain_text, favicon_url, og_image_url, thumbnail_key, screenshot_key, is_favorite, is_archived, scrape_status, ai_status, safety_status, safety_reasons, scrape_error, ai_error, timestamps |
| 2   | Add indexes                | user_id, (user_id, url) UNIQUE, created_at, (user_id, is_favorite), (user_id, is_archived)                                                                                                                                                                                               |
| 3   | Create Bookmark model      | Lucid model with column decorators, relationships (belongsTo User), status enums                                                                                                                                                                                                         |
| 4   | Update shared types        | Add/verify `Bookmark`, `BookmarkStatus`, `SafetyStatus` types in `@mykb/shared`                                                                                                                                                                                                          |
| 5   | Verify                     | Migration runs, model compiles, `pnpm turbo build` passes                                                                                                                                                                                                                                |

**Estimated files:** ~6

---

## PR 2: `phase2/bookmark-api` — Repository, validator, service, controller, routes

**Goal:** Full CRUD API for bookmarks with validation and pagination.

| #   | Task                        | Details                                                                                                     |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Create BookmarkRepository   | CRUD operations, pagination, filtering (favorite, archived, user_id), sorting                               |
| 2   | Create bookmark validators  | create (url required), update (partial), query params (page, limit, sort, filters)                          |
| 3   | Create BookmarkService      | Business logic: create, update, delete, toggle favorite/archive                                             |
| 4   | Create BookmarksController  | index, show, store, update, destroy, favorite, archive                                                      |
| 5   | Add routes                  | `GET/POST /api/bookmarks`, `GET/PATCH/DELETE /api/bookmarks/:id`, `PATCH .../favorite`, `PATCH .../archive` |
| 6   | Wire auth + role middleware | All routes require auth, write operations require editor+                                                   |
| 7   | Verify                      | All endpoints return consistent API envelope, pagination works                                              |

**Estimated files:** ~8

---

## PR 3: `phase2/bookmark-grid` — Bookmark grid/list view with pagination

**Goal:** Display bookmarks in a grid or list view with pagination controls.

| #   | Task                             | Details                                                                                     |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Create BookmarkCard component    | Thumbnail placeholder, title, domain, description snippet, tag badges placeholder, time ago |
| 2   | Create BookmarkActions component | Dropdown/button group for favorite, archive, delete — reused in card and detail views       |
| 3   | Create BookmarkGrid component    | CSS grid layout, responsive columns                                                         |
| 4   | Create BookmarkList component    | List layout alternative                                                                     |
| 5   | Create pagination component      | Page numbers, prev/next, items per page selector                                            |
| 6   | Create useBookmarks hook         | Fetch bookmarks from API with pagination/filter params                                      |
| 7   | Update dashboard page            | Replace empty state with bookmark grid, view toggle (grid/list)                             |
| 8   | Verify                           | Bookmarks display, pagination works, empty state shows when no bookmarks                    |

**Estimated files:** ~11

---

## PR 4: `phase2/add-dialog` — Add bookmark dialog

**Goal:** Modal dialog to add a new bookmark by URL.

| #   | Task                                          | Details                                                       |
| --- | --------------------------------------------- | ------------------------------------------------------------- |
| 1   | Install Shadcn dialog component               | `npx shadcn@latest add dialog input label`                    |
| 2   | Create AddBookmarkDialog                      | URL input (required), optional title override, submit handler |
| 3   | Add "Add Bookmark" button to dashboard header | Opens dialog                                                  |
| 4   | Wire API call                                 | POST /api/bookmarks with URL, show success/error feedback     |
| 5   | Verify                                        | Dialog opens, URL validates, bookmark created, grid refreshes |

**Estimated files:** ~6

---

## PR 5: `phase2/detail` — Bookmark detail page

**Goal:** Full bookmark detail view with metadata display.

| #   | Task                                             | Details                                                                 |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| 1   | Create `/dashboard/bookmarks/[id]/page.tsx`      | Bookmark detail with all metadata                                       |
| 2   | Create BookmarkDetail component                  | Title, URL, description, timestamps, status indicators, actions         |
| 3   | Create `/dashboard/bookmarks/[id]/edit/page.tsx` | Edit bookmark metadata (title, description) — requires editor+ role     |
| 4   | Create BookmarkEditForm component                | Pre-filled form with title, description, URL (readonly), submit handler |
| 5   | Wire API calls                                   | GET /api/bookmarks/:id, PATCH /api/bookmarks/:id                        |
| 6   | Add navigation from grid                         | Click bookmark card → detail page                                       |
| 7   | Verify                                           | Detail page loads, edit form saves, back navigation works               |

**Estimated files:** ~7

---

## PR 6: `phase2/favorites-archive` — Favorites and archive pages

**Goal:** Dedicated views for favorited and archived bookmarks.

| #   | Task                                   | Details                                         |
| --- | -------------------------------------- | ----------------------------------------------- |
| 1   | Create `/dashboard/favorites/page.tsx` | Filtered bookmark grid (is_favorite=true)       |
| 2   | Create `/dashboard/archive/page.tsx`   | Filtered bookmark grid (is_archived=true)       |
| 3   | Wire filter params                     | Pass filter to useBookmarks hook                |
| 4   | Verify                                 | Favorites/archive show correct filtered results |

**Estimated files:** ~4

---

## PR 7: `phase2/tests` — Tests for bookmark CRUD

**Goal:** Unit and integration tests for bookmark API and components.

| #   | Task                     | Details                                                    |
| --- | ------------------------ | ---------------------------------------------------------- |
| 1   | API functional tests     | CRUD operations, pagination, filtering, auth enforcement   |
| 2   | API unit tests           | BookmarkRepository queries, BookmarkService business logic |
| 3   | Frontend component tests | BookmarkCard, AddBookmarkDialog, pagination                |
| 4   | Verify                   | All tests pass, 80%+ coverage on new code                  |

**Estimated files:** ~8

---

## Final Verification

- [ ] `pnpm turbo build` — all packages compile
- [ ] `pnpm turbo lint` — no lint errors
- [ ] `pnpm turbo test` — all tests pass
- [ ] Add a bookmark via dialog → appears in grid
- [ ] Favorite a bookmark → appears in favorites page
- [ ] Archive a bookmark → appears in archive page
- [ ] Delete a bookmark → removed from grid
- [ ] Pagination works with 20+ bookmarks
- [ ] Bookmark detail page shows all metadata
- [ ] Viewer role cannot create/edit/delete bookmarks
