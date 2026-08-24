# Verification report

Observed in the package build environment on 2026-08-10.

## Passed

- `node scripts/check-luminous-boundaries.js` -> passed.
- `node scripts/check-syntax.js` -> passed.
- `node --test tests/core/*.test.js` -> 3/3 passed.
- `node apps/api/scripts/migrate.js` -> passed using Node 22 `node:sqlite`.
- `node apps/api/scripts/seed.js` -> passed.
- Running seed twice remains idempotent for bootstrap data: 3 players, 3 snapshots, 200 transactions.
- Auction dataset contains 8 distinct managers.
- Market model seed: 1 model.
- `player-snapshot.schema.json` validates all 3 bundled sample snapshots (3/3).
- Core indicator service was executed for sample player IDs 6875, 2521 and 2097.
- Scarcity is intentionally `null` until the full current Listone exists rather than using an invented replacement player.

## Not observed / environment limitations

- `npm install` could not complete because this execution environment routes npm to an internal registry that returned `404` for `@fastify/cors` (and previously `@cucumber/cucumber`). This is an environment/package-mirror limitation, not a claim that the public npm packages are unavailable.
- Because dependencies could not be installed here, the Fastify API/BFF and Webpack design-system runtime build were not executed in this environment.
- Docker CLI/daemon is not available in this environment; `docker compose up` was not observed.

Do not convert these unobserved checks into green claims. Run `./bootstrap.sh` and `docker compose up --build` in the target development machine.
