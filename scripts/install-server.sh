#!/bin/sh
# Installs the Neon Ronin site on a VPS, run ON the server as root from inside the cloned repo.
# It only ADDS things: one nginx site for $DOMAIN. Other sites and apps on the server are never edited.
# The site is static (no engine): nginx serves dist/, the sealed and revealed metadata, and proxies
# /rpc to the Robinhood Chain RPC for visitors whose DNS blocks it.
#
#   DOMAIN=neonronin.xyz sh scripts/install-server.sh          first install (safe to run again)
#   DOMAIN=neonronin.xyz sh scripts/install-server.sh update   after `git pull`: rebuild the site
#   DOMAIN=neonronin.xyz sh scripts/install-server.sh https    once the domain's DNS points here
set -e
DOMAIN="${DOMAIN:?Set DOMAIN, e.g. DOMAIN=neonronin.xyz sh scripts/install-server.sh}"
APP="$(cd "$(dirname "$0")/.." && pwd)"
RPC=rpc.mainnet.chain.robinhood.com
say() { printf '\n\033[1;33m== %s\033[0m\n' "$*"; }

[ "$(id -u)" = 0 ] || { echo "Run as root."; exit 1; }

if [ "$1" = https ]; then
  say "HTTPS certificate for $DOMAIN"
  command -v certbot >/dev/null || apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --redirect --non-interactive --agree-tos --register-unsafely-without-email --keep-until-expiring
  echo "Done: https://$DOMAIN"
  exit 0
fi

build() {
  say "Building the site"
  cd "$APP"
  [ -d vault ] && { echo "vault/ is on this server. It holds the sealed drop and must never be uploaded. Remove it."; exit 1; }
  npm ci --no-audit --no-fund
  npm run build
}

if [ "$1" = update ]; then
  build
  nginx -t && systemctl reload nginx
  exit 0
fi

export DEBIAN_FRONTEND=noninteractive

say "1/5 Packages (Node 20, nginx, certbot) — only what is missing"
command -v curl >/dev/null || (apt-get update && apt-get install -y curl)
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  if command -v node >/dev/null; then echo "Node $(node -v) is older than 20. Upgrade it first (other apps may depend on it)."; exit 1; fi
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs
fi
command -v nginx >/dev/null || apt-get install -y nginx
command -v certbot >/dev/null || apt-get install -y certbot python3-certbot-nginx

say "2/5 Port 80 must belong to nginx"
OWNER="$(ss -ltnp 'sport = :80' 2>/dev/null | grep -o 'users:(("[^"]*' | head -1 | cut -d'"' -f2)"
if [ -n "$OWNER" ] && [ "$OWNER" != nginx ]; then
  echo "Port 80 is used by '$OWNER', not nginx. Stopping here so nothing else breaks."; exit 1
fi

say "3/5 Robinhood RPC reachable? (Indonesian DNS blocks it; the /rpc proxy needs it)"
rpc_ok() { curl -s -m 15 -X POST "https://$RPC" -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' | grep -q 0x1237; }
if rpc_ok; then
  echo "RPC OK"
else
  echo "RPC blocked: switching this server's DNS to encrypted DNS (Cloudflare + Google, DNS-over-TLS)."
  mkdir -p /etc/systemd/resolved.conf.d
  cat > /etc/systemd/resolved.conf.d/10-dot.conf <<'EOF'
[Resolve]
DNS=1.1.1.1#cloudflare-dns.com 8.8.8.8#dns.google 1.0.0.1#cloudflare-dns.com
FallbackDNS=8.8.4.4#dns.google
DNSOverTLS=yes
Domains=~.
EOF
  systemctl restart systemd-resolved
  sleep 3
  rpc_ok && echo "RPC OK now" || { echo "RPC still unreachable. Send this output to the developer."; exit 1; }
fi

build

say "4/5 nginx site for $DOMAIN (a new file; other sites untouched)"
CONF=/etc/nginx/sites-available/$DOMAIN
if [ ! -f "$CONF" ]; then
  cat > "$CONF" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    root $APP/dist;
    index index.html;

    # Read-only JSON-RPC for the site's mint counter, so visitors never talk to the blocked RPC directly.
    location = /rpc {
        limit_except POST { deny all; }
        proxy_pass https://$RPC/;
        proxy_ssl_server_name on;
        proxy_set_header Host $RPC;
        proxy_set_header Content-Type application/json;
    }
    # Token metadata and art: wallets and marketplaces fetch these from anywhere.
    location ~ ^/(hidden|collection)/ {
        add_header Access-Control-Allow-Origin "*";
        add_header Cache-Control "public, max-age=300";
        try_files \$uri =404;
    }
    location = /provenance.json {
        add_header Access-Control-Allow-Origin "*";
        try_files \$uri =404;
    }
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
}
NGINX
  ln -sf "$CONF" "/etc/nginx/sites-enabled/$DOMAIN"
fi
chmod o+x /root 2>/dev/null || true
if nginx -t; then systemctl reload nginx; else
  echo "nginx config test failed: removing only the $DOMAIN site again."
  rm -f "/etc/nginx/sites-enabled/$DOMAIN" "$CONF"; exit 1
fi

say "5/5 Check"
curl -s -H "Host: $DOMAIN" http://127.0.0.1/hidden/1.json | head -c 160; echo
curl -s -H "Host: $DOMAIN" -X POST http://127.0.0.1/rpc -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'; echo

IP="$(curl -s -m 8 -4 ifconfig.me || hostname -I | cut -d' ' -f1)"
say "Installed."
echo "In the domain's DNS add:  A @ -> $IP   and   A www -> $IP"
echo "Once DNS works:  DOMAIN=$DOMAIN sh scripts/install-server.sh https"
