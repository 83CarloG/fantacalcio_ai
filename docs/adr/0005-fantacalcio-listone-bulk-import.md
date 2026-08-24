# ADR-0005: On-demand bulk listone import from Fantacalcio.it

Status: ACCEPTED

## Decision

`POST /v1/sources/fantacalcio/listone` (and its CLI twin, `npm --workspace @fanta/api run import:listone`) fetches `https://www.fantacalcio.it/quotazioni-fantacalcio` — a single page listing every Serie A player with role, team, quotation and FVM (classic and Mantra) — and upserts all of them into `players`. One request replaces the previous per-player-detail-page approach (`apps/api/src/sources/operations/collectFantacalcio.js`, which only ever extracted a page title and was never wired to a route).

This is deliberately **on-demand only**, never part of `npm run bootstrap`/seed:
- it makes a live outbound request to a third party, which bootstrap must not depend on (a prior verification pass in this project ran in an environment with no outbound npm/network access at all);
- the seed data (3 sample players, 200 auction transactions, the market model) must stay a fast, deterministic, offline baseline.

## Consequences

- The dashboard/listone starts with only the 3 seed players until someone triggers the import (via the "Importa listone da Fantacalcio.it" button on `/players`, the API route, or the CLI script).
- `players.quotation_classic/fvm_classic/quotation_mantra/fvm_mantra` are populated by whichever ran last: the sample-snapshot seed or this importer. The importer only ever `UPDATE`s on conflict (never `INSERT OR REPLACE`), so it cannot violate the `player_snapshots.player_id` foreign key for players that already have snapshot history.
- FPEDIA per-player enrichment (projections/skills/risk for the full listone) is explicitly out of scope here — it would mean ~500 individual live requests per run, a materially heavier operation that deserves its own decision when it's built.
