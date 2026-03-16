# Phase 4: AI Features — Tasks

> **Deliverable:** Bookmarks get AI summaries and auto-tags. Manual tag management works.

## Dependencies

- Phase 3 complete (scraping, content safety, job pipeline)

## PR Stack

```
main
 └── phase4/ai-service           # PR 1: Gemini API client with rate limiting
      └── phase4/tags-migration  # PR 2: Tags + bookmark_tags tables + models
           └── phase4/tags-api   # PR 3: Tag repository, service, controller, routes
                └── phase4/ai-jobs  # PR 4: SummarizeBookmarkJob + GenerateTagsJob
                     └── phase4/frontend  # PR 5: AI summary display + tag management UI
                          └── phase4/tests  # PR 6: Tests
```

---

## PR 1: `phase4/ai-service` — Gemini API client

| #   | Task                     | Details                                                                                        |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| 1   | Create AIService         | Gemini API client, rate limiting (1 req/sec), response validation against expected JSON schema |
| 2   | Summarization method     | Input: plain_text, output: 2-3 sentence summary                                                |
| 3   | Tag generation method    | Input: plain_text + title, output: 3-5 tag strings                                             |
| 4   | Prompt injection defense | Scraped content passed as user content with clear delimiters, never as system prompt           |

**Estimated files:** ~3

## PR 2: `phase4/tags-migration` — Database tables + models

| #   | Task                           | Details                                                                 |
| --- | ------------------------------ | ----------------------------------------------------------------------- |
| 1   | Create tags migration          | id, name, slug, user_id (FK), is_ai_generated, created_at               |
| 2   | Create bookmark_tags migration | bookmark_id (FK CASCADE), tag_id (FK CASCADE), created_at, composite PK |
| 3   | Create Tag model               | With slug generation, belongsTo User, manyToMany Bookmarks              |
| 4   | Create BookmarkTag pivot model | Timestamps                                                              |
| 5   | Update Bookmark model          | Add manyToMany Tags relationship                                        |
| 6   | Add indexes                    | (user_id, slug) UNIQUE on tags                                          |

**Estimated files:** ~6

## PR 3: `phase4/tags-api` — Tag CRUD API

| #   | Task                  | Details                                                                                   |
| --- | --------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Create TagRepository  | CRUD, find-or-create by slug, list with bookmark counts                                   |
| 2   | Create tag validators | Create (name), update (name), add tags to bookmark                                        |
| 3   | Create TagService     | Create, rename, delete, add/remove from bookmark                                          |
| 4   | Create TagsController | index, store, update, destroy                                                             |
| 5   | Add routes            | `GET/POST /api/tags`, `PATCH/DELETE /api/tags/:id`, `POST/DELETE /api/bookmarks/:id/tags` |

**Estimated files:** ~8

## PR 4: `phase4/ai-jobs` — Summarize + generate tags jobs

| #   | Task                        | Details                                                                                                          |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Create SummarizeBookmarkJob | Only runs if safety_status safe/skipped, calls AIService, updates bookmark summary + ai_status                   |
| 2   | Create GenerateTagsJob      | Only runs if safety_status safe/skipped, calls AIService, creates tags via find-or-create, marks is_ai_generated |
| 3   | Wire into pipeline          | After ContentSafetyJob passes → enqueue both jobs in parallel                                                    |
| 4   | Update FTS5 index           | After summary and tags are set (placeholder for Phase 5)                                                         |

**Estimated files:** ~4

## PR 5: `phase4/frontend` — AI summary + tag management UI

| #   | Task                         | Details                                                        |
| --- | ---------------------------- | -------------------------------------------------------------- |
| 1   | AI summary display           | Summary callout on bookmark detail page                        |
| 2   | Tag badges on bookmark cards | Show tags with color coding (AI vs manual)                     |
| 3   | Tag management UI            | Add/remove tags on bookmark detail, autocomplete existing tags |
| 4   | Tags browse page             | `/dashboard/tags` — tag cloud/list with bookmark counts        |
| 5   | Tags filter page             | `/dashboard/tags/[slug]` — bookmarks filtered by tag           |

**Estimated files:** ~10

## PR 6: `phase4/tests` — Tests

| #   | Task                 | Details                                                               |
| --- | -------------------- | --------------------------------------------------------------------- |
| 1   | AIService unit tests | Mock Gemini API, test summarization + tag generation + error handling |
| 2   | Tag API tests        | CRUD, find-or-create, add/remove from bookmark                        |
| 3   | Job tests            | SummarizeBookmarkJob, GenerateTagsJob with mocked AIService           |
| 4   | Frontend tests       | Tag badges, tag input, AI summary display                             |

**Estimated files:** ~8

---

## Final Verification

- [ ] Add bookmark → after scrape + safety → AI summary generated
- [ ] Auto-tags appear on bookmark (marked as AI-generated)
- [ ] Manual tags can be added/removed
- [ ] Tags page shows all tags with counts
- [ ] Clicking a tag filters bookmarks
- [ ] AI errors handled gracefully (ai_status=failed, bookmark still usable)
