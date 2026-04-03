#!/usr/bin/env bash
set -euo pipefail

echo "==> Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

echo "==> Installing Node.js v22 via NodeSource..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "==> Installing pnpm v10.32.1..."
sudo corepack enable
corepack prepare pnpm@10.32.1 --activate

echo "==> Installing PM2 globally..."
sudo npm install -g pm2

echo "==> Installing Caddy..."
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy

echo "==> Opening firewall ports (80, 443)..."
sudo apt-get install -y iptables-persistent
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

echo "==> Creating app directory..."
sudo mkdir -p /opt/mykb
sudo chown "$USER:$USER" /opt/mykb

echo "==> Cloning repository..."
if [ ! -d /opt/mykb/.git ]; then
  git clone https://github.com/usbryanchlam/mykb.git /opt/mykb
else
  echo "    Repository already cloned, skipping."
fi

echo "==> Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env files to /opt/mykb/apps/api/.env and /opt/mykb/apps/web/.env.local"
echo "  2. cd /opt/mykb && pnpm install --frozen-lockfile"
echo "  3. pnpm turbo build"
echo "  4. cd apps/api && node ace migration:run --force"
echo "  5. Copy infra/Caddyfile to /etc/caddy/Caddyfile && sudo systemctl restart caddy"
echo "  6. pm2 start infra/ecosystem.config.cjs && pm2 save && pm2 startup"
