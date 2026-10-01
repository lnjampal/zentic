#!/usr/bin/env bash
# Zentic — one-command local setup (macOS).
# Needs: Node.js 20+ and Docker Desktop (running). Run from this folder:  bash start-local.sh
set -e
cd "$(dirname "$0")"
API_PORT=8080

command -v node >/dev/null || { echo "Install Node.js 20+ first: https://nodejs.org (or: brew install node)"; exit 1; }
command -v docker >/dev/null || { echo "Install & start Docker Desktop first: https://www.docker.com/products/docker-desktop"; exit 1; }
docker info >/dev/null 2>&1 || { echo "Docker Desktop is installed but not running — open it and retry."; exit 1; }

echo "==> Starting local Supabase (first run downloads images, ~5 min)…"
npx -y supabase@latest start
echo "==> Applying database migrations + demo data…"
npx -y supabase@latest db reset

eval "$(npx -y supabase@latest status -o env | sed 's/^/export SB_/')"
SB_URL_VAL="${SB_API_URL}"; ANON="${SB_ANON_KEY}"; SERVICE="${SB_SERVICE_ROLE_KEY}"

if [ ! -f server/.env ]; then
  sed -e "s#^NODE_ENV=.*#NODE_ENV=development#" -e "s#^PORT=.*#PORT=${API_PORT}#" \
      -e "s#^SUPABASE_URL=.*#SUPABASE_URL=${SB_URL_VAL}#" -e "s#^SUPABASE_ANON_KEY=.*#SUPABASE_ANON_KEY=${ANON}#" \
      -e "s#^SUPABASE_SERVICE_ROLE_KEY=.*#SUPABASE_SERVICE_ROLE_KEY=${SERVICE}#" server/.env.example > server/.env
  echo "==> wrote server/.env"
fi
if [ ! -f web/.env.local ]; then
  ENC=$(openssl rand -base64 32)
  sed -e "s#^NEXT_PUBLIC_SUPABASE_URL=.*#NEXT_PUBLIC_SUPABASE_URL=${SB_URL_VAL}#" \
      -e "s#^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*#NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON}#" \
      -e "s#^ZENTIC_ENCRYPTION_KEY=.*#ZENTIC_ENCRYPTION_KEY=${ENC}#" \
      -e "s#^NEXT_PUBLIC_API_URL=.*#NEXT_PUBLIC_API_URL=http://localhost:${API_PORT}#" \
      -e "s#=sk-\.\.\.\$#=#; s#=sk-ant-\.\.\.\$#=#; s#=AIza\.\.\.\$#=#; s#=pplx-\.\.\.\$#=#; s#=xai-\.\.\.\$#=#" \
      web/.env.example > web/.env.local
  echo "SUPABASE_SERVICE_ROLE_KEY=${SERVICE}" >> web/.env.local
  echo "==> wrote web/.env.local"
fi

echo "==> Installing dependencies…"
(cd server && npm install --no-audit --no-fund)
(cd web && npm install --no-audit --no-fund)

echo "==> Starting API (port ${API_PORT}) and web (port 3000)…"
(cd server && npm run dev) &
API_PID=$!
trap "kill $API_PID 2>/dev/null; echo; echo 'Stopped. (Supabase keeps running; stop it with: npx supabase stop)'" EXIT
cd web && npx next dev -p 3000 &
sleep 8
echo ""
echo "  Zentic:            http://localhost:3000"
echo "  Demo login:        demo@zentic.local  /  demo123"
echo "  Database (Studio): http://localhost:54323"
echo "  Press Ctrl+C to stop."
open http://localhost:3000 2>/dev/null || true
wait
