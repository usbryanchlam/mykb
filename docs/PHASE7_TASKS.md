# Phase 7: Infrastructure + Deployment — Tasks

> **Deliverable:** App deployed to mykb.bryanlam.dev with automated CI/CD.

## Dependencies

- Phase 6 complete (admin, polish, security)

## PR Stack

```
main
 └── phase7/infra-config       # PR 1: Caddyfile + PM2 config + setup script
      └── phase7/ci-update     # PR 2: Update CI workflow (add test jobs)
           └── phase7/deploy   # PR 3: Deploy workflow (SSH + build + migrate)
                └── phase7/env-docs  # PR 4: Environment variable docs + startup validation
```

---

## PR 1: `phase7/infra-config` — Server configuration files

| #   | Task                       | Details                                                                                 |
| --- | -------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Create Caddyfile           | Reverse proxy: `/api/*` → `:3333`, `/*` → `:3000`, auto SSL via Let's Encrypt           |
| 2   | Create ecosystem.config.js | PM2 config: manage AdonisJS + Next.js processes, restart on crash                       |
| 3   | Create setup.sh            | VM bootstrap: install Node.js, pnpm, Caddy, PM2, configure firewall (ports 80, 443, 22) |

**Estimated files:** ~3

## PR 2: `phase7/ci-update` — Update CI workflow

| #   | Task                 | Details                                                   |
| --- | -------------------- | --------------------------------------------------------- |
| 1   | Add test-api job     | `pnpm turbo test --filter=@mykb/api` with coverage upload |
| 2   | Add test-web job     | `pnpm turbo test --filter=@mykb/web` with coverage upload |
| 3   | Add build job        | `pnpm turbo build` to verify production build             |
| 4   | Update existing jobs | Ensure lint, typecheck, format still run                  |

**Estimated files:** ~1

## PR 3: `phase7/deploy` — Deploy workflow

| #   | Task                                  | Details                                                                                                 |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Create `.github/workflows/deploy.yml` | Trigger on push to main                                                                                 |
| 2   | SSH into OCI VM                       | Use `appleboy/ssh-action`                                                                               |
| 3   | Deploy steps                          | git pull, pnpm install --frozen-lockfile, pnpm turbo build, node ace migration:run --force, pm2 restart |
| 4   | Health check                          | curl https://mykb.bryanlam.dev/health (expect 200)                                                      |
| 5   | Add GitHub secrets                    | SSH_HOST, SSH_USERNAME, SSH_KEY, SSH_PORT                                                               |

**Estimated files:** ~1

## PR 4: `phase7/env-docs` — Environment documentation

| #   | Task                     | Details                                                                               |
| --- | ------------------------ | ------------------------------------------------------------------------------------- |
| 1   | Update root .env.example | All production env vars documented                                                    |
| 2   | Create deployment guide  | Step-by-step OCI VM setup instructions                                                |
| 3   | Startup validation       | Verify all required env vars present at boot (already in env.ts, review completeness) |

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
