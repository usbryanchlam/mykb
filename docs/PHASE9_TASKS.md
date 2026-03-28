# Phase 9: Infrastructure + Deployment — Tasks

> **Deliverable:** App deployed to mykb.bryanlam.dev with automated CI/CD.

## Dependencies

- Phase 8 complete (security assessment)

## PR Stack

```
main
 └── phase9/infra-config       # PR 1: Caddyfile + PM2 config + setup script
      └── phase9/deploy         # PR 2: Deploy workflow (SSH + build + migrate)
           └── phase9/env-docs  # PR 3: Environment variable docs + startup validation
```

---

## PR 1: `phase9/infra-config` — Server configuration files

**Goal:** Configuration files for deploying to OCI VM.

| #   | Task                       | Details                                                                                 |
| --- | -------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Create Caddyfile           | Reverse proxy: `/api/*` → `:3333`, `/*` → `:3000`, auto SSL via Let's Encrypt           |
| 2   | Create ecosystem.config.js | PM2 config: manage AdonisJS + Next.js processes, restart on crash                       |
| 3   | Create setup.sh            | VM bootstrap: install Node.js, pnpm, Caddy, PM2, configure firewall (ports 80, 443, 22) |
| 4   | Verify                     | Config files are valid, build passes                                                    |

**Estimated files:** ~3

---

## PR 2: `phase9/deploy` — Deploy workflow

**Goal:** Automated deployment on push to main.

| #   | Task                                  | Details                                                                                                 |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Create `.github/workflows/deploy.yml` | Trigger on push to main                                                                                 |
| 2   | SSH into OCI VM                       | Use `appleboy/ssh-action`                                                                               |
| 3   | Deploy steps                          | git pull, pnpm install --frozen-lockfile, pnpm turbo build, node ace migration:run --force, pm2 restart |
| 4   | Health check                          | curl https://mykb.bryanlam.dev/health (expect 200)                                                      |
| 5   | Add GitHub secrets                    | SSH_HOST, SSH_USERNAME, SSH_KEY, SSH_PORT                                                               |
| 6   | Verify                                | Workflow syntax is valid, build passes                                                                  |

**Estimated files:** ~1

---

## PR 3: `phase9/env-docs` — Environment documentation

**Goal:** Document all environment variables and deployment steps.

| #   | Task                     | Details                                                                               |
| --- | ------------------------ | ------------------------------------------------------------------------------------- |
| 1   | Update root .env.example | All production env vars documented                                                    |
| 2   | Create deployment guide  | Step-by-step OCI VM setup instructions                                                |
| 3   | Startup validation       | Verify all required env vars present at boot (already in env.ts, review completeness) |
| 4   | Verify                   | Build passes                                                                          |

**Estimated files:** ~3

---

## Final Verification

- [ ] OCI VM provisioned and accessible via SSH
- [ ] `setup.sh` installs all dependencies on fresh VM
- [ ] Caddy serves app at mykb.bryanlam.dev with HTTPS
- [ ] PM2 manages both processes, restarts on crash
- [ ] Push to main triggers deploy workflow
- [ ] Deploy runs migrations and restarts processes
- [ ] Health check passes after deploy
- [ ] CI runs lint, typecheck, test, build on every PR
- [ ] All environment variables documented
