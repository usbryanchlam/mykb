# Phase 7: Fit-and-Finish — User Feedback

## Round 1 (2026-03-29)

### F7-001: Duplicate search bars on Search page

**Severity:** UX
**Description:** When navigating to `/dashboard/search`, the header search bar and the page's own search bar are both visible — redundant and confusing.
**Expected:** Either hide the header search bar on the search page, or remove the page-level search bar and use the header bar with the `useSearch` hook.

### F7-002: "Add to Collection" button not visible — role assignment gap

**Severity:** HIGH (functional)
**Description:** The "Add to Collection" button, "Edit" button, and tag remove buttons are hidden because the logged-in user has no role assigned in Auth0, defaulting to `viewer`. Allowlisted users cannot edit anything.
**Expected:** Allowlisted users should default to `editor` role. App owner should be `admin`.
**Root cause:** No Auth0 Action/Rule assigns roles to tokens. The role claim `https://mykb.bryanlam.dev/roles` is empty for all users.
**Fix:** Create an Auth0 post-login Action that assigns `editor` to allowlisted users and `admin` to the owner.

### F7-003: Archived bookmarks still appear in "All Bookmarks"

**Severity:** MEDIUM (UX)
**Description:** Archiving a bookmark does not remove it from the main dashboard ("All Bookmarks"). The purpose of archiving is to declutter the main view.
**Expected:** "All Bookmarks" should exclude archived bookmarks by default. Archived bookmarks should only appear in the Archive page.

### F7-004: Smart List date filter — same-day range returns empty

**Severity:** MEDIUM (bug)
**Description:** Setting "Created after" and "Created before" to the same date (e.g., 2026-03-28) returns no results, even if bookmarks were created that day.
**Root cause:** `createdAt` includes time (`2026-03-28T14:30:00`), but the date input sends `2026-03-28` (midnight). `<= 2026-03-28` means before midnight at the start of that day, excluding the entire day.
**Fix:** Adjust "Created before" to end-of-day (`T23:59:59`) or use `< next_day`.

### F7-006: Bookmark detail page not fully responsive on mobile

**Severity:** MEDIUM (UX)
**Description:** On mobile viewport, the bookmark detail page has a horizontal scrollbar. The "AI Summary" card and "Reader View" section overflow the viewport width.
**Expected:** All content should fit within the viewport without horizontal scrolling. Long text should wrap, and cards should use `max-w-full` / `overflow-hidden` / `break-words` as needed.

### F7-007: Reader View lacks content styling — headings, tables, code blocks, lists unstyled

**Severity:** HIGH (UX)
**Description:** Reader View renders scraped HTML content without visual formatting. Headings appear as plain text (no size/weight differentiation), code blocks have no background/border, tables lose their column structure, and lists render as flat lines without bullets.
**Expected:** Reader View should apply typography styles to rendered HTML elements: `h1`-`h6` with appropriate sizes, `<code>`/`<pre>` with background and monospace font, `<table>` with borders and cell padding, `<ul>`/`<ol>` with proper list markers and indentation.
**Screenshots:** reader_view1.png, reader_view2.png

### F7-009: Bookmark edit form — inputs don't fill card width

**Severity:** LOW (UX)
**Description:** On the edit bookmark page, the URL and Title input fields are narrower than the card container and don't stretch to full width. The Description textarea does stretch, making it inconsistent. The URL field also truncates the full URL. The overall card could be wider to use more screen space on desktop.
**Fix:** Ensure all inputs use `w-full` within the form. Consider widening the card or removing the `max-w` constraint.
**Screenshot:** edit_dialog.png

### F7-008: Search bar ⌘K badge — hidden on mobile, overflows on desktop

**Severity:** LOW (UX)
**Description:** Two issues with the keyboard shortcut badge:

1. **Mobile:** The `⌘K` badge is shown but useless on touchscreen devices — no keyboard shortcut available. It wastes space in the narrow mobile search bar.
2. **Desktop:** The `⌘K` badge overflows outside the search input border. The input is `w-64` but not wide enough to contain the badge at `right-2`.
   **Fix:** Hide `⌘K` badge on mobile (`hidden md:inline`). On desktop, either widen the input or adjust badge positioning to stay inside the border.
   **Screenshots:** search_bar_mobile.png, search_bar_desktop.png

### F7-010: Rescrape spinner never stops — page doesn't refresh after pipeline completes

**Severity:** MEDIUM (UX)
**Description:** When clicking "Rescrape" on the bookmark detail page, the spinner keeps spinning indefinitely. The rescrape API returns immediately (it triggers a background pipeline), but the page never polls for updated status. User must navigate away and back to see the updated scrape result.
**Expected:** After rescrape is triggered, either poll the bookmark status until the pipeline completes, or show a success message indicating the rescrape was triggered and the page needs to be refreshed.
**Fix:** Either add polling (fetch bookmark every few seconds until scrapeStatus changes) or show a toast/message and re-fetch the bookmark once after a short delay.

### F7-005: Demo account concept not designed

**Severity:** LOW (feature gap)
**Description:** No design for a read-only demo account that can browse existing bookmarks without editing. Decisions needed: shared login vs public access, which data is visible, whether it's a real Auth0 user or a separate access path.
**Status:** Deferred — to be designed and scoped separately.
