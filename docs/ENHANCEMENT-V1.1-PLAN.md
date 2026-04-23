# Enhancement Plan v1.1

## Overview

Three enhancements to expand MyKB beyond URL bookmarking into a richer knowledge capture tool.

| #   | Feature                       | Summary                                                                      | Status        |
| --- | ----------------------------- | ---------------------------------------------------------------------------- | ------------- |
| E1  | Rich paste detection          | Preserve formatting (headings, bold, lists) when pasting content manually    | Merged (#133) |
| E2  | User-facing "Knowledge" label | Rename "Bookmarks" → "Knowledge" in all user-facing text (no code/DB rename) | Merged (#149) |
| E3  | YouTube transcript scraping   | Auto-extract transcripts from YouTube video links                            | Merged (#150) |
| E4  | Card preview thumbnails       | Display OG image previews on knowledge cards with graceful fallbacks         | Merged (#155) |

---

## E1: Rich Paste Detection

### Problem

The current manual content input accepts plain text only. When users copy-paste from websites (e.g., Medium, Substack behind paywalls), all formatting — headings, bold, bullet points, code blocks — is lost.

### Solution

Detect `text/html` from the browser clipboard on paste events. Sanitize the HTML with DOMPurify and store it directly, preserving the original formatting in Reader View.

### Implementation

#### Frontend Changes

**`reader-view.tsx` — ManualContentForm**

Replace the plain `<textarea>` with a content-editable div or enhance the textarea with paste event handling:

```tsx
// On paste, check for HTML content
const handlePaste = (e: React.ClipboardEvent) => {
  const html = e.clipboardData.getData('text/html')
  if (html) {
    e.preventDefault()
    const sanitized = DOMPurify.sanitize(html, ALLOWED_CONFIG)
    // Store sanitized HTML
  }
}
```

- When `text/html` is available in clipboard: sanitize and store as HTML
- When only `text/plain` is available: wrap in `<p>` tags as currently done
- Show a visual indicator ("Rich content detected") when HTML paste is captured
- Add a "Paste as plain text" toggle for users who prefer stripping formatting

#### API Changes

**`PATCH /api/bookmarks/:id/content`**

Update to accept an optional `content_type` field:

```
{
  "plain_text": "raw text for AI processing",
  "content": "<h2>Heading</h2><p>Formatted content...</p>",  // optional
}
```

- If `content` is provided: store it directly (already DOMPurify-sanitized on frontend, re-sanitize on server for defense-in-depth)
- If only `plain_text` is provided: generate `<p>` tags as currently done
- `plainText` is always stored for AI summarization and search indexing
- Extract `plainText` from HTML if only `content` is provided: strip tags to derive plain text

#### Files to Modify

| File                                                | Change                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/web/src/components/bookmarks/reader-view.tsx` | Replace textarea with paste-aware input, handle `text/html` clipboard data    |
| `apps/api/app/validators/bookmark.ts`               | Add optional `content` field to `updateContentValidator`                      |
| `apps/api/app/services/bookmark_service.ts`         | Accept optional pre-formatted `content`, strip HTML for `plainText` if needed |
| `apps/api/app/services/scraper_service.ts`          | Extract `stripHtml()` utility for reuse                                       |

#### Test Plan

- Paste rich HTML (headings, bold, lists) → verify formatting preserved in Reader View
- Paste plain text → verify wraps in `<p>` tags as before
- Verify DOMPurify sanitizes dangerous HTML (scripts, event handlers)
- Verify `plainText` extracted correctly for AI processing

---

## E2: User-Facing "Knowledge" Label

### Problem

"Bookmarks" is limiting for a knowledge base app. The term doesn't cover manual notes, pasted articles, or YouTube transcripts.

### Approach

Rename only **user-facing labels** — sidebar, page titles, headings, buttons, empty states, and meta tags. **No code/DB/API/URL changes.** This avoids touching 50+ files, database migrations, and breaking API contracts.

### Labels to Change

| Location                | Current                                                             | New                                                             |
| ----------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| Sidebar nav             | "All Bookmarks"                                                     | "All Knowledge"                                                 |
| Sidebar nav             | "Favorites"                                                         | "Favorites" (keep)                                              |
| Sidebar nav             | "Archive"                                                           | "Archive" (keep)                                                |
| Dashboard page title    | "All Bookmarks"                                                     | "All Knowledge"                                                 |
| Dashboard empty state   | "No bookmarks yet"                                                  | "No knowledge yet"                                              |
| Dashboard empty state   | "Start building your knowledge base by adding your first bookmark." | "Start building your knowledge base by adding your first item." |
| Add dialog button       | "Add Bookmark"                                                      | "Add Knowledge"                                                 |
| Add dialog title        | "Add Bookmark"                                                      | "Add Knowledge"                                                 |
| Add dialog URL label    | (keep as-is)                                                        | Add note: "Optional — leave empty for manual content"           |
| Bookmark detail heading | (dynamic title)                                                     | (keep)                                                          |
| Favorites empty state   | "No favorites yet" / "Star your bookmarks..."                       | "Star your items to find them quickly here."                    |
| Archive empty state     | "Archived bookmarks will appear here."                              | "Archived items will appear here."                              |
| Delete confirmation     | "Delete this bookmark?"                                             | "Delete this item?"                                             |
| Search placeholder      | "Search bookmarks..."                                               | "Search knowledge..."                                           |
| Admin dashboard         | "Bookmarks" stat card                                               | "Knowledge Items"                                               |
| Landing page            | "bookmarking, summarizing..."                                       | "capturing, summarizing..."                                     |

### Files to Modify

| File                                                        | Change                                 |
| ----------------------------------------------------------- | -------------------------------------- |
| `apps/web/src/components/layout/sidebar.tsx`                | "All Bookmarks" → "All Knowledge"      |
| `apps/web/src/app/(dashboard)/dashboard/page.tsx`           | Title, empty state text, button labels |
| `apps/web/src/app/(dashboard)/dashboard/favorites/page.tsx` | Empty state text                       |
| `apps/web/src/app/(dashboard)/dashboard/archive/page.tsx`   | Empty state text                       |
| `apps/web/src/components/bookmarks/add-bookmark-dialog.tsx` | Dialog title, button label             |
| `apps/web/src/components/bookmarks/bookmark-actions.tsx`    | Delete confirmation text               |
| `apps/web/src/components/search/search-bar.tsx`             | Placeholder text                       |
| `apps/web/src/app/(dashboard)/dashboard/admin/page.tsx`     | Stat card label                        |
| `apps/web/src/app/page.tsx`                                 | Landing page description               |
| `apps/web/src/app/layout.tsx`                               | Meta title/description                 |

### What Does NOT Change

- Database tables, columns, API routes, URL paths (`/dashboard/bookmarks/:id`)
- Model/service/controller/repository names
- TypeScript types (`Bookmark`, `BookmarkTag`)
- Test assertions that check functional behavior (not label text)
- Component file names

---

## E3: YouTube Transcript Scraping

### Problem

Users want to save YouTube videos and have the transcript available for AI summarization, tagging, and search.

### Solution

Detect YouTube URLs during scraping. Fetch the video transcript using the `youtube-transcript` npm package (zero dependencies, 13KB). Store the transcript as `plainText` and generate formatted HTML for Reader View.

### Package Choice

| Package                    | Size | Dependencies            | Recommendation                  |
| -------------------------- | ---- | ----------------------- | ------------------------------- |
| `youtube-transcript`       | 13KB | 0                       | **Chosen** — simplest, lightest |
| `youtube-captions-scraper` | 10KB | 4 (axios, lodash, etc.) | Good but heavier deps           |
| `youtubei.js`              | 15MB | 2                       | Overkill — full YouTube client  |

### Implementation

#### YouTube Detection

```typescript
function isYouTubeUrl(url: string): boolean {
  const parsed = new URL(url)
  return (
    parsed.hostname === 'www.youtube.com' ||
    parsed.hostname === 'youtube.com' ||
    parsed.hostname === 'youtu.be' ||
    parsed.hostname === 'm.youtube.com'
  )
}

function extractVideoId(url: string): string | null {
  const parsed = new URL(url)
  if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1)
  return parsed.searchParams.get('v')
}
```

#### Transcript Fetching

```typescript
import { fetchTranscript } from 'youtube-transcript'

async function getYouTubeTranscript(videoId: string): Promise<{
  plainText: string
  content: string
}> {
  const segments = await fetchTranscript(videoId)

  // Plain text: join all segments (for AI + search)
  const plainText = segments.map((s) => s.text).join(' ')

  // HTML: formatted with timestamps
  const content = segments
    .map((s) => {
      const mins = Math.floor(s.offset / 60000)
      const secs = Math.floor((s.offset % 60000) / 1000)
      const timestamp = `${mins}:${secs.toString().padStart(2, '0')}`
      return `<p><span class="timestamp">[${timestamp}]</span> ${escapeHtml(s.text)}</p>`
    })
    .join('\n')

  return { plainText, content }
}
```

#### Metadata via oEmbed (no API key needed)

```
GET https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json
```

Returns: `title`, `author_name`, `thumbnail_url` — all we need for the bookmark card.

#### Scraper Service Changes

Modify `ScrapeBookmarkJob` to detect YouTube URLs and branch:

```
ScrapeBookmarkJob.execute():
  if isYouTubeUrl(url):
    1. Fetch oEmbed metadata (title, author, thumbnail)
    2. Fetch transcript via youtube-transcript
    3. Store plainText (joined segments) + content (timestamped HTML)
    4. Set scrapeStatus = 'completed'
  else:
    (existing scrape logic)
```

#### Transcript Size Handling

YouTube transcripts can be long:

- 10-minute video: ~1,500 words
- 1-hour video: ~9,000 words
- 2-hour video: ~18,000 words

For AI summarization, truncate `plainText` to the first 10,000 words (well within Gemini's context window). Store full transcript for Reader View and search.

#### Reader View Styling

Add CSS for timestamp spans in the reader view:

```css
.timestamp {
  color: var(--muted-foreground);
  font-size: 0.75em;
  font-family: monospace;
  margin-right: 0.5em;
}
```

#### Files to Modify

| File                                                | Change                                                        |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `apps/api/package.json`                             | Add `youtube-transcript` dependency                           |
| `apps/api/app/services/youtube_service.ts`          | New service: URL detection, transcript fetch, oEmbed metadata |
| `apps/api/app/jobs/scrape_bookmark_job.ts`          | Branch on YouTube URL, use YouTubeService                     |
| `apps/api/app/services/scraper_service.ts`          | Extract `escapeHtml` to shared utility                        |
| `apps/web/src/components/bookmarks/reader-view.tsx` | Timestamp styling for transcript content                      |
| Tests                                               | YouTube service unit tests, scrape job integration tests      |

#### Error Handling

- **No transcript available** (live streams, music videos): Fall back to oEmbed metadata only, set `plainText` to video description, `scrapeStatus = 'completed'`
- **Video unavailable/private**: Set `scrapeStatus = 'failed'` with descriptive error
- **Rate limiting**: The `youtube-transcript` package uses YouTube's public page, rate limits are generous for personal use

---

## PR History

| PR   | Feature                                       | Files | Status |
| ---- | --------------------------------------------- | ----- | ------ |
| #133 | E1: Rich paste detection in ManualContentForm | 4     | Merged |
| #149 | E2: Rename user-facing labels to "Knowledge"  | 31    | Merged |
| #150 | E3: YouTube transcript scraping + Reader View | 9     | Merged |
| #155 | E4: Card preview thumbnails                   | 9     | Merged |

---

## Success Criteria

- [x] Pasting rich content (from browser) preserves headings, bold, lists in Reader View
- [x] Plain text paste still works as before
- [x] User-facing text says "Knowledge" instead of "Bookmarks"
- [x] YouTube video URLs are detected and transcript is extracted automatically
- [x] YouTube transcript appears in Reader View with timestamps
- [x] AI summary and tags are generated from YouTube transcripts
- [x] Knowledge cards display preview thumbnails (OG image or stored thumbnail)
- [x] All existing tests pass, new tests cover the additions
