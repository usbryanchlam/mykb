# Phase 3: Scraping + Content Safety + Reader View — Tasks

> **Deliverable:** Adding a bookmark triggers metadata extraction + content safety check. Unsafe content is flagged and blocked from reader view. Safe bookmarks proceed to AI processing.

## Dependencies

- Phase 2 complete (bookmark CRUD)

## PR Stack

```
main
 └── phase3/job-queue             # PR 1: In-process job queue
      └── phase3/scraper          # PR 2: Scraper service + ScrapeBookmarkJob
           └── phase3/safety      # PR 3: Content safety service + ContentSafetyJob
                └── phase3/storage  # PR 4: OCI Object Storage service
                     └── phase3/pipeline  # PR 5: Wire job pipeline on bookmark creation
                          └── phase3/reader-view  # PR 6: Frontend reader view + status UI
                               └── phase3/tests  # PR 7: Tests
```

---

## PR 1: `phase3/job-queue` — In-process job queue

| #   | Task                      | Details                                                                                                |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | Create JobService         | In-process async queue with concurrency control (max 2), retry logic (3 attempts, exponential backoff) |
| 2   | Create job_logs migration | Table: id, job_type, bookmark_id (FK), status, error_message, started_at, completed_at, created_at     |
| 3   | Create JobLog model       | Lucid model with status tracking                                                                       |
| 4   | Create base job interface | Abstract job with execute(), onFailure(), maxAttempts, backoff config                                  |

**Estimated files:** ~6

## PR 2: `phase3/scraper` — Scraper service + ScrapeBookmarkJob

| #   | Task                     | Details                                                                                                                                  |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Create ScraperService    | Fetch URL (15s timeout, 10MB limit, 3 redirects max), extract metadata (cheerio/linkedom), Readability extraction, plain text extraction |
| 2   | Create ScrapeBookmarkJob | Calls ScraperService, updates bookmark (title, description, content, plain_text, scrape_status), enqueues ContentSafetyJob on success    |
| 3   | Add SSRF prevention      | Block private/loopback/link-local IPs, http/https only                                                                                   |

**Estimated files:** ~5

## PR 3: `phase3/safety` — Content safety service + ContentSafetyJob

| #   | Task                        | Details                                                                                         |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | Create ContentSafetyService | Three layers: Google Safe Browsing API, DOMPurify HTML sanitization, Gemini AI content analysis |
| 2   | Create ContentSafetyJob     | Runs after scrape, gates AI jobs. SAFE → continue, FLAGGED → halt pipeline                      |
| 3   | Add env vars                | GOOGLE_SAFE_BROWSING_API_KEY, GEMINI_API_KEY validation                                         |

**Estimated files:** ~5

## PR 4: `phase3/storage` — OCI Object Storage service

| #   | Task                  | Details                                                      |
| --- | --------------------- | ------------------------------------------------------------ |
| 1   | Create StorageService | Upload/download/delete from OCI Object Storage               |
| 2   | Add env vars          | OCI_OBJECT_STORAGE_NAMESPACE, BUCKET, ACCESS_KEY, SECRET_KEY |
| 3   | Wire thumbnail upload | Upload OG image as thumbnail during scrape                   |

**Estimated files:** ~4

## PR 5: `phase3/pipeline` — Wire job pipeline on bookmark creation

| #   | Task                                             | Details                                    |
| --- | ------------------------------------------------ | ------------------------------------------ |
| 1   | Trigger ScrapeBookmarkJob on POST /api/bookmarks | After bookmark created, enqueue scrape job |
| 2   | Add POST /api/bookmarks/:id/rescrape             | Re-trigger scrape + safety + AI pipeline   |
| 3   | Add GET /api/bookmarks/:id/reader                | Return sanitized reader-view content       |

**Estimated files:** ~4

## PR 6: `phase3/reader-view` — Frontend reader view + status UI

| #   | Task                                    | Details                                                             |
| --- | --------------------------------------- | ------------------------------------------------------------------- |
| 1   | Create ReaderView component             | Clean article display, DOMPurify-sanitized HTML, font size controls |
| 2   | Create scrape/safety status indicators  | Pending/processing/completed/failed badges on bookmark cards        |
| 3   | Create flagged content warning          | Block reader view for flagged bookmarks, show safety_reasons        |
| 4   | Add reader view to bookmark detail page | Tab or section in detail view                                       |

**Estimated files:** ~6

## PR 7: `phase3/tests` — Tests

| #   | Task              | Details                                                                                |
| --- | ----------------- | -------------------------------------------------------------------------------------- |
| 1   | Unit tests        | ScraperService (mock HTTP), ContentSafetyService (mock APIs), JobService (queue logic) |
| 2   | Integration tests | Pipeline end-to-end: create bookmark → scrape → safety check                           |
| 3   | Frontend tests    | ReaderView, status indicators, flagged content warning                                 |

**Estimated files:** ~8

---

## Final Verification

- [ ] Add bookmark → scrape job runs automatically
- [ ] Metadata (title, description, favicon) extracted and displayed
- [ ] Content safety check runs after scrape
- [ ] Flagged bookmarks show warning, reader view blocked
- [ ] Safe bookmarks show reader view with clean HTML
- [ ] Re-scrape button works
- [ ] Job logs track all job executions
- [ ] SSRF protection blocks private IPs
