# Phase 6: Admin + Polish — Tasks

> **Deliverable:** Admin page links to Auth0. App is polished, responsive, and security-hardened.

## Dependencies

- Phase 5 complete (search, collections, smart lists)

## PR Stack

```
main
 └── phase6/admin              # PR 1: Admin dashboard page + stats API
      └── phase6/security      # PR 2: Rate limiting + security headers
           └── phase6/error-pages  # PR 3: Error pages (404, 403, 500)
                └── phase6/polish  # PR 4: Loading states, responsive, meta tags
                     └── phase6/tests  # PR 5: Tests
```

---

## PR 1: `phase6/admin` — Admin dashboard + stats API

| #   | Task                               | Details                                                                  |
| --- | ---------------------------------- | ------------------------------------------------------------------------ |
| 1   | Create `GET /api/admin/stats`      | Bookmark count, storage usage, job status summary (admin only)           |
| 2   | Create `/dashboard/admin/page.tsx` | App stats display, link to Auth0 Dashboard for user/allowlist management |
| 3   | Gate with role middleware          | Admin role required                                                      |

**Estimated files:** ~5

## PR 2: `phase6/security` — Rate limiting + security headers

| #   | Task                                 | Details                                                                                          |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 1   | Add rate limiting                    | `@adonisjs/limiter` on all endpoints, stricter limits on write operations                        |
| 2   | Add security headers                 | CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy |
| 3   | Re-enable CSRF/CSP where appropriate | Review shield config from Phase 0                                                                |

**Estimated files:** ~4

## PR 3: `phase6/error-pages` — Error pages

| #   | Task                                 | Details                                                                                           |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 1   | Update 404 page                      | Styled not-found page matching app theme                                                          |
| 2   | Create 403 page                      | Forbidden/unauthorized page                                                                       |
| 3   | Create 500 page                      | Generic error page (no stack traces in production)                                                |
| 4   | Create error boundary                | React error boundary for frontend crashes                                                         |
| 5   | Harden API error handler             | Verify production errors return generic messages only, no stack traces or internal details leaked |
| 6   | Add error handling integration tests | Verify 404/403/500 responses don't expose sensitive info, test error boundary renders fallback UI |

**Estimated files:** ~7

## PR 4: `phase6/polish` — UI polish

| #   | Task                | Details                                                          |
| --- | ------------------- | ---------------------------------------------------------------- |
| 1   | Loading states      | Add skeleton loaders to all data-fetching pages                  |
| 2   | Responsive design   | Sidebar collapses on mobile, grid adapts, touch-friendly actions |
| 3   | Create footer       | Minimal footer with version/copyright for dashboard layout       |
| 4   | Favicon + meta tags | Proper favicon, OG tags, description                             |
| 5   | Accessibility pass  | Keyboard navigation, focus management, ARIA attributes           |

**Estimated files:** ~11

## PR 5: `phase6/tests` — Tests

| #   | Task                  | Details                          |
| --- | --------------------- | -------------------------------- |
| 1   | Admin API tests       | Stats endpoint, role enforcement |
| 2   | Rate limiting tests   | Verify limits are enforced       |
| 3   | Security header tests | Verify headers are set correctly |

**Estimated files:** ~4

---

## Final Verification

- [ ] Admin page shows app stats (admin role only)
- [ ] Auth0 Dashboard link works
- [ ] Rate limiting blocks excessive requests
- [ ] Security headers set correctly (check with securityheaders.com)
- [ ] Error pages render correctly (404, 403, 500)
- [ ] App is responsive on mobile
- [ ] All pages have loading skeletons
