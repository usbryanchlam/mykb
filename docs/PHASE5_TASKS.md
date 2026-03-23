# Phase 5: Search + Collections + Smart Lists — Tasks

> **Deliverable:** Full-text search, collections, and smart lists all working.

## Dependencies

- Phase 4 complete (AI features, tags)

## PR Stack

```
main
 └── phase5/fts5-search         # PR 1: FTS5 virtual table + search service + API
      └── phase5/search-ui      # PR 2: Frontend search bar (Cmd+K) + results page
           └── phase5/collections-api    # PR 3: Collections migration + CRUD API
                └── phase5/collections-ui  # PR 4: Collections frontend
                     └── phase5/smart-lists  # PR 5: Smart lists migration + API + UI
```

---

## PR 1: `phase5/fts5-search` — FTS5 + search service + API

**Goal:** Full-text search over bookmarks using SQLite FTS5.

| #   | Task                      | Details                                                                                                                        |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Create FTS5 migration     | Virtual table: bookmarks_fts (title, description, summary, plain_text, tags), content='bookmarks', tokenize='porter unicode61' |
| 2   | Create FTS5 sync triggers | INSERT/UPDATE/DELETE triggers on bookmarks table, rebuild trigger for tag changes                                              |
| 3   | Create SearchService      | FTS5 query builder, snippet extraction, ranking                                                                                |
| 4   | Create SearchController   | `GET /api/search?q=term&page=1&limit=20`                                                                                       |
| 5   | Add route                 | Wire with auth middleware                                                                                                      |
| 6   | Tests                     | FTS5 index sync, search queries, ranking, snippets, auth enforcement                                                           |
| 7   | Verify                    | Tests pass, build passes                                                                                                       |

**Estimated files:** ~8

---

## PR 2: `phase5/search-ui` — Frontend search

**Goal:** Search bar with keyboard shortcut and results page.

| #   | Task                                | Details                                                            |
| --- | ----------------------------------- | ------------------------------------------------------------------ |
| 1   | Create SearchBar component          | Debounced input (300ms), keyboard shortcut Cmd+K / Ctrl+K to focus |
| 2   | Create SearchResults component      | Highlighted snippets, bookmark cards                               |
| 3   | Create `/dashboard/search/page.tsx` | Search results page                                                |
| 4   | Add search bar to dashboard header  | Always visible in header                                           |
| 5   | Create useSearch hook               | Debounced API calls, loading states                                |
| 6   | Component tests                     | SearchBar keyboard shortcut, debounce, SearchResults rendering     |
| 7   | Verify                              | Tests pass, build passes                                           |

**Estimated files:** ~8

---

## PR 3: `phase5/collections-api` — Collections migration + CRUD API

**Goal:** Collections with bookmark association and CRUD API.

| #   | Task                                  | Details                                                                                           |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Create collections migration          | id, user_id (FK), name, description, icon, sort_order, timestamps                                 |
| 2   | Create bookmark_collections migration | bookmark_id (FK CASCADE), collection_id (FK CASCADE), sort_order, created_at, composite PK        |
| 3   | Create Collection model               | With relationships (hasMany bookmarks through pivot)                                              |
| 4   | Create CollectionRepository           | CRUD, list with bookmark counts, add/remove bookmarks                                             |
| 5   | Create CollectionsController + routes | `GET/POST /api/collections`, `GET/PATCH/DELETE /api/collections/:id`, `POST/DELETE .../bookmarks` |
| 6   | Functional tests                      | Collection CRUD, add/remove bookmarks, cascade delete, auth enforcement                           |
| 7   | Verify                                | Tests pass, build passes                                                                          |

**Estimated files:** ~12

---

## PR 4: `phase5/collections-ui` — Frontend collections

**Goal:** Collections UI with create, browse, and add-to-collection actions.

| #   | Task                                             | Details                                                          |
| --- | ------------------------------------------------ | ---------------------------------------------------------------- |
| 1   | Create CollectionCard component                  | Icon, name, description, bookmark count                          |
| 2   | Create CreateCollectionDialog                    | Name, description, icon picker                                   |
| 3   | Create `/dashboard/collections/page.tsx`         | Grid of all collections                                          |
| 4   | Create `/dashboard/collections/[id]/page.tsx`    | Bookmarks in a collection                                        |
| 5   | Add "Add to collection" action on bookmark cards | Dropdown to select collection                                    |
| 6   | Component tests                                  | CollectionCard, CreateCollectionDialog, add-to-collection action |
| 7   | Verify                                           | Tests pass, build passes                                         |

**Estimated files:** ~10

---

## PR 5: `phase5/smart-lists` — Smart lists migration + API + UI

**Goal:** User-defined filtered views with a visual query builder.

| #   | Task                                 | Details                                                                    |
| --- | ------------------------------------ | -------------------------------------------------------------------------- |
| 1   | Create smart_lists migration         | id, user_id (FK), name, description, icon, filter_query (JSON), timestamps |
| 2   | Create SmartList model               | With filter_query JSON parsing                                             |
| 3   | Create SmartListService              | Resolve filter_query to bookmark query                                     |
| 4   | Create SmartListsController + routes | CRUD + resolved bookmarks endpoint                                         |
| 5   | Create frontend pages                | `/dashboard/smart-lists`, `/dashboard/smart-lists/[id]`                    |
| 6   | Create filter query builder UI       | Visual filter builder (tags, favorite, date range)                         |
| 7   | Tests                                | SmartListService filter resolution, API CRUD, filter builder component     |
| 8   | Verify                               | Tests pass, build passes                                                   |

**Estimated files:** ~14

---

## Final Verification

- [ ] Cmd+K opens search, results appear with highlighted snippets
- [ ] Collections CRUD works, bookmarks can be added/removed
- [ ] Smart lists filter bookmarks by saved criteria
- [ ] FTS5 index stays in sync with bookmark changes
- [ ] Search finds bookmarks by title, description, summary, and tags
