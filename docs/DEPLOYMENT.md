# Deployment Guide

MyKB is deployed on an OCI (Oracle Cloud Infrastructure) VM running Ubuntu, with Caddy as a reverse proxy and PM2 for process management.

**Production URL:** https://mykb.bryanlam.dev

## Architecture

```
Internet
  │
  ▼
Caddy (ports 80/443, auto SSL via Let's Encrypt)
  │
  ├── /api/*    → AdonisJS API (port 3333)
  ├── /auth/*   → Next.js (port 3000, Auth0 callback routes)
  ├── /health   → AdonisJS API (port 3333)
  └── /*        → Next.js (port 3000, frontend)
```

**Stack:**

- **VM:** OCI Ubuntu, reserved public IP
- **Reverse proxy:** Caddy with automatic HTTPS (Let's Encrypt)
- **Process manager:** PM2 (manages `mykb-api` and `mykb-web`)
- **Database:** SQLite (file at `apps/api/tmp/db.sqlite3`)
- **Auth:** Auth0 with Google OAuth
- **AI:** Google Gemini API (summarization + tag generation)

## Prerequisites

- OCI VM with Ubuntu (ARM or x86)
- Reserved public IP
- DNS A record pointing `mykb.bryanlam.dev` to the VM IP
- SSH access to the VM
- GitHub repository access

## Initial VM Setup

SSH into the VM and run the setup script:

```bash
# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/usbryanchlam/mykb/main/infra/setup.sh | bash
```

This installs Node.js 22, pnpm, PM2, Caddy, and opens firewall ports 80/443.

### What the setup script does

1. Updates system packages
2. Installs Node.js v22 via NodeSource
3. Enables pnpm via corepack
4. Installs PM2 globally
5. Installs Caddy
6. Opens firewall ports 80 and 443 (iptables)
7. Clones the repository to `/opt/mykb`

## Environment Variables

### API (`/opt/mykb/apps/api/.env`)

| Variable                | Description                                            | Example                         |
| ----------------------- | ------------------------------------------------------ | ------------------------------- |
| `TZ`                    | Timezone                                               | `UTC`                           |
| `PORT`                  | API port                                               | `3333`                          |
| `HOST`                  | API host                                               | `localhost`                     |
| `NODE_ENV`              | Environment                                            | `production`                    |
| `LOG_LEVEL`             | Log level                                              | `info`                          |
| `APP_KEY`               | Encryption key (generate with `node ace generate:key`) | `random-32-char-string`         |
| `APP_URL`               | API base URL                                           | `https://mykb.bryanlam.dev`     |
| `CORS_ORIGIN`           | Allowed CORS origins (comma-separated)                 | `https://mykb.bryanlam.dev`     |
| `AUTH0_ISSUER_BASE_URL` | Auth0 domain with https://                             | `https://dev-xxx.us.auth0.com`  |
| `AUTH0_AUDIENCE`        | Auth0 API audience                                     | `https://mykb.bryanlam.dev/api` |
| `GEMINI_API_KEY`        | Google Gemini API key                                  | `AIza...`                       |

### Web (`/opt/mykb/apps/web/.env.local`)

| Variable                | Description                                               | Example                         |
| ----------------------- | --------------------------------------------------------- | ------------------------------- |
| `AUTH0_SECRET`          | Session encryption (generate with `openssl rand -hex 32`) | `random-hex-string`             |
| `AUTH0_BASE_URL`        | App base URL                                              | `https://mykb.bryanlam.dev`     |
| `AUTH0_ISSUER_BASE_URL` | Auth0 domain with https://                                | `https://dev-xxx.us.auth0.com`  |
| `AUTH0_CLIENT_ID`       | Auth0 application client ID                               | `abc123...`                     |
| `AUTH0_CLIENT_SECRET`   | Auth0 application client secret                           | `xyz789...`                     |
| `AUTH0_AUDIENCE`        | Auth0 API audience                                        | `https://mykb.bryanlam.dev/api` |
| `API_URL`               | Internal API URL                                          | `http://127.0.0.1:3333`         |

## First Deployment (Manual)

After running `setup.sh`:

```bash
cd /opt/mykb

# 1. Create environment files
#    Copy .env.example files and fill in values:
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
#    Edit both files with actual values (see tables above)

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Build
pnpm turbo build

# 4. Post-build setup (AdonisJS loads .env from build/ directory)
cp apps/api/.env apps/api/build/.env
mkdir -p apps/api/tmp
ln -sf /opt/mykb/apps/api/tmp apps/api/build/tmp

# 5. Run migrations
cd apps/api && node ace migration:run --force && cd ../..

# 6. Configure Caddy
sudo cp infra/Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy

# 7. Start services with PM2
pm2 start infra/ecosystem.config.cjs
pm2 save
pm2 startup  # Follow the printed command to enable auto-start on reboot

# 8. Verify
curl -sf http://localhost:3333/health  # Should return {"status":"ok"}
```

## Automated Deployment (GitHub Actions)

Subsequent deployments are triggered manually via GitHub Actions.

### GitHub Secrets Required

Set these in **Settings > Secrets and variables > Actions**:

| Secret         | Description                                   |
| -------------- | --------------------------------------------- |
| `SSH_HOST`     | VM public IP address                          |
| `SSH_USERNAME` | SSH user (e.g., `ubuntu`)                     |
| `SSH_KEY`      | Private SSH key (contents of `~/.ssh/id_rsa`) |
| `SSH_PORT`     | SSH port (default `22`)                       |

### Triggering a Deploy

1. Go to **Actions > Deploy** in GitHub
2. Click **Run workflow**
3. Select `main` branch
4. Click **Run workflow**

### What the Deploy Workflow Does

1. **Test job:** Runs lint, typecheck, build, and tests
2. **Deploy job** (only if tests pass):
   - SSH into the VM
   - `git pull --ff-only origin main`
   - `pnpm install --frozen-lockfile`
   - `pnpm turbo build`
   - Copy `.env` to `build/` and symlink `tmp/`
   - Stop PM2 services
   - Backup SQLite database
   - Run migrations
   - Restart PM2 services
   - Health check with retry (up to 12 attempts, 5s apart)

## Infrastructure Files

| File                           | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `infra/Caddyfile`              | Caddy reverse proxy config (route rules, HSTS, compression) |
| `infra/ecosystem.config.cjs`   | PM2 process config (API on port 3333, web on port 3000)     |
| `infra/setup.sh`               | VM bootstrap script                                         |
| `.github/workflows/deploy.yml` | Automated deploy workflow (manual trigger)                  |
| `.github/workflows/ci.yml`     | CI pipeline (runs on every PR)                              |

## Common Operations

### Check service status

```bash
pm2 status
pm2 logs              # Live logs
pm2 logs --lines 50   # Last 50 lines
```

### Restart services

```bash
pm2 restart all
# or individually:
pm2 restart mykb-api
pm2 restart mykb-web
```

### Run migrations manually

```bash
cd /opt/mykb/apps/api
node ace migration:run --force
```

### Backup database

```bash
cp /opt/mykb/apps/api/tmp/db.sqlite3 ~/db-backup-$(date +%Y%m%d).sqlite3
```

### Check Caddy status

```bash
sudo systemctl status caddy
sudo caddy validate --config /etc/caddy/Caddyfile
```

### View SSL certificate

```bash
curl -vI https://mykb.bryanlam.dev 2>&1 | grep -A5 "SSL certificate"
```

## Troubleshooting

### AdonisJS .env not found

AdonisJS loads `.env` from the `build/` directory in production, not the project root. After every build:

```bash
cp apps/api/.env apps/api/build/.env
```

### SQLite "database table is locked" during migration

Stop PM2 before running migrations — the API process holds a DB connection:

```bash
pm2 stop all
cd apps/api && node ace migration:run --force && cd ../..
pm2 restart all
```

If migrations still fail (Lucid internal transaction wrapping), run the SQL manually:

```bash
sqlite3 apps/api/tmp/db.sqlite3 < migration.sql
```

### SQLite WAL/SHM files after crash

If you see "disk I/O error", stale WAL files may exist:

```bash
rm -f apps/api/tmp/db.sqlite3-wal apps/api/tmp/db.sqlite3-shm
```

### PM2 + Next.js "SyntaxError"

PM2 tries to execute `node_modules/.bin/next` as JavaScript, but it's a shell wrapper. The `ecosystem.config.cjs` uses the correct entry point: `node_modules/.bin/next` with `args: 'start --port 3000'`.

### Let's Encrypt certificate fails

- Verify DNS A record points directly to the VM (no Cloudflare proxy)
- Verify no CNAME record conflicts with the A record
- Verify iptables rules allow ports 80 and 443 **before** any REJECT rule:
  ```bash
  sudo iptables -L INPUT -n --line-numbers
  ```

### iptables rule ordering

ACCEPT rules must come before any REJECT-all rule. If ports 80/443 are blocked:

```bash
# Find the REJECT rule position
sudo iptables -L INPUT -n --line-numbers | grep REJECT

# Insert ACCEPT rules before it (e.g., position 5)
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## Security Notes

- `CORS_ORIGIN` env var restricts API access to the production frontend URL
- Auth0 handles authentication; the API validates JWT tokens
- Rate limiting is applied to all API endpoints (100 req/min) and admin endpoints (30 req/min)
- Content is sanitized server-side with DOMPurify before storage
- HSTS header is set by Caddy at the edge
