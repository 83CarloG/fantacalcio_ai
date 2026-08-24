#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p runtime apps/web-bff/public/design-system

if [ ! -d node_modules ]; then
  npm install
fi

npm run build:ds
rm -rf apps/web-bff/public/design-system
mkdir -p apps/web-bff/public/design-system
cp -R packages/design-system/dist/. apps/web-bff/public/design-system/

node apps/api/scripts/migrate.js
node apps/api/scripts/seed.js
npm run verify

echo "Bootstrap complete. Start API with: npm run dev:api"
echo "Start Web BFF with: npm run dev:web"
