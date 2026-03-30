# Phase 7: Fit-and-Finish — Tasks

> **Deliverable:** Production-quality UI/UX verified through comprehensive manual testing.

## Dependencies

- Phase 6 complete (admin, polish, security headers, error pages)

## Approach

This phase is **user-driven and iterative**. The user performs manual testing on localhost, provides feedback on UI/UX issues and functional bugs, and fixes are implemented in PRs until the quality bar is met.

### Process

1. User tests all features on localhost (desktop + mobile)
2. User reports issues and feedback
3. Issues are fixed in focused PRs
4. Repeat until user is satisfied

### Areas to Test

| Area              | Details                                                |
| ----------------- | ------------------------------------------------------ |
| Bookmark CRUD     | Add, edit, delete, favorite, archive bookmarks         |
| Scraping pipeline | New bookmarks get scraped, AI summary, auto-tags       |
| Search            | Cmd+K shortcut, search results, highlighted snippets   |
| Tags              | Add/remove tags, tag browse page, filter by tag        |
| Collections       | Create, delete, add/remove bookmarks, browse           |
| Smart Lists       | Create with filters, verify resolved bookmarks match   |
| Admin dashboard   | Stats display, role-gated access                       |
| Reader view       | Content display, safety flags, font controls           |
| Responsive design | Mobile sidebar, search bar, grid layout, touch targets |
| Dark mode         | All pages render correctly in dark theme               |
| Error handling    | 404, 403, error boundary, network failures             |
| Loading states    | Skeleton loaders on all data-fetching pages            |
| Navigation        | Sidebar links, back buttons, breadcrumbs               |
| Forms             | Validation messages, error states, loading spinners    |
| Typography        | Font rendering, readability, spacing                   |

## Completion Criteria

- [ ] All reported issues fixed
- [ ] User confirms app meets quality bar for deployment
- [ ] No outstanding UI/UX regressions
