# Pull Request Practice

## Tool: Graphite

All PRs are managed and submitted using [Graphite](https://graphite.dev/). Graphite enables stacked PRs with dependency tracking, making it easy to break large features into reviewable increments.

### CLI Commands Reference

| Command | Purpose |
|---|---|
| `gt create -m "feat: description"` | Create a new branch and PR from current changes |
| `gt stack submit` | Submit all PRs in the current stack |
| `gt stack restack` | Rebase the entire stack after a base branch update |
| `gt modify -c` | Amend current branch and restack dependents |
| `gt checkout <branch>` | Switch to a branch in the stack |
| `gt log` | View the current stack |
| `gt trunk` | Switch back to main |

---

## Stacked PRs

### Principle

Every feature or bugfix should be broken down into multiple small, incremental PRs stacked on top of each other. Each PR in the stack must be independently reviewable and must not break the app.

### Guidelines

1. **Plan the stack before coding** — identify logical increments (e.g., migration, model, service, controller, frontend)
2. **Each PR does one thing** — a single concern per PR (schema change, business logic, UI component, etc.)
3. **Small PRs** — aim for under 400 lines changed per PR; easier to review, faster to merge
4. **Bottom-up ordering** — lower PRs in the stack are foundational (DB, models); upper PRs build on them (API, UI)
5. **Each PR has a clear title and description** — summarize what and why, not how

### Example: Adding a New Feature (e.g., "Collections")

```
main
 └── feat/collections-migration        # PR 1: DB migration + model
      └── feat/collections-repository   # PR 2: Repository + service layer
           └── feat/collections-api     # PR 3: Controller + routes + validators
                └── feat/collections-ui # PR 4: Frontend components + hooks
```

Each PR is reviewed and merged bottom-up. Graphite handles rebasing the stack automatically.

---

## CI Requirements

Every PR must pass all CI checks before it can be approved and merged. No exceptions.

| Check | Command | What It Validates |
|---|---|---|
| Lint | `npm run lint` | Code style, import ordering, no unused variables |
| Test | `npm run test` | Unit + integration tests pass, coverage threshold met |
| Build | `npm run build` | TypeScript compiles, no type errors, production build succeeds |

### Rules

- **No broken builds in the stack** — every PR in a stack must independently pass lint, test, and build
- **No skipping checks** — never use `--no-verify` or skip CI steps
- **Fix forward** — if a PR breaks CI, fix it in the same PR, not in a later one
- **Tests accompany code** — PRs that add/change logic must include corresponding tests

---

## Code Review

### Reviewer

**@usbryanchlam** is the sole code reviewer and approver for all PRs.

### Review Process

1. Author creates stacked PRs via Graphite
2. Author submits the stack: `gt stack submit`
3. CI runs automatically on each PR in the stack
4. Reviewer reviews bottom-up (foundational PRs first)
5. Reviewer approves or requests changes on each PR
6. Once approved and CI passes, the PR is merged via Graphite
7. Graphite automatically restacks dependent PRs

### What the Reviewer Looks For

- **Correctness** — does the code do what the PR description says?
- **Security** — no hardcoded secrets, input validation, proper auth checks
- **Immutability** — no mutation of existing objects
- **Error handling** — errors handled explicitly, not swallowed
- **Test coverage** — new logic has tests, edge cases covered
- **File size** — files under 800 lines, functions under 50 lines
- **Naming** — clear, descriptive variable and function names
- **Scope** — PR does not include unrelated changes

### PR Description Template

```markdown
## What

Brief description of what this PR does.

## Why

Context on why this change is needed.

## How

Key implementation details (only if non-obvious).

## Stack

- PR 1: [link] (this PR)
- PR 2: [link] (depends on this)

## Test Plan

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing done (describe steps)
```

---

## Branch Naming

Use Graphite's default branch naming or follow this convention:

```
<type>/<short-description>

Examples:
feat/collections-migration
feat/collections-api
fix/bookmark-scrape-timeout
refactor/job-queue-retry-logic
chore/update-dependencies
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

---

## Merging Strategy

- **Squash merge** — each PR becomes a single commit on main (clean history)
- **Graphite manages merge order** — stacked PRs merge bottom-up automatically
- **Delete branch after merge** — Graphite handles cleanup
- **Never force-push to main** — all changes go through PRs
