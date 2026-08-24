# LEARNED

## Open questions

- **G1 semantics gate (blocking)**: `rig` and the row's `data-penalties` on `/statistiche-serie-a`, and the Titolare/Entrato/Squalificato/Infortunato/Inutilizzato percentages on the player detail pages, cannot be interpreted before the season starts (every value is 0 pre-season). `rig`/`penalties_raw` are therefore stored as RAW TEXT and no derived metric uses them yet. Verify at G1 whether `Gol` already includes penalties before building any custom league-adjusted fantasy average — the double-counting risk is real.
- Ensemble FCP/ALG weights are an uncalibrated 50/50. Recalibrate after G1-G4 by rank-correlating each signal separately against observed MV/FM; until then every derived bundle carries the "uncalibrated" warning.
- Re-test Fantacalcio.it and FPEDIA parsers after the summer market closes.
- Decide whether the second persistence target is MySQL from day one or after SQLite MVP validation.
- The price model has only one complete historical auction season. Confidence must remain conservative until another complete auction ledger exists.

## Resolved

- FPEDIA per-player enrichment is built: `enrichFpediaBatch` (concurrency 2 + jitter, retry/backoff, per-player state in `player_source_sync_state`, resumable, `full`/`stale`/`retry-failed`/`force` modes). Two live full runs: 435/435 successes.

## Stable lessons

- Fantacalcio.it is the canonical eligibility/list identity source.
- FPEDIA enriches players with projections and qualitative signals.
- FSTATS is optional and excluded from the MVP critical path.
- Auction-specific price behavior is league-specific; FVM is a strong baseline but not a sufficient maximum-bid rule.
- `apps/api` and `apps/web-bff` files that resolve sibling paths (config, db, public, drivers) must anchor on `__dirname`, never `process.cwd()`. `npm --workspace <pkg> run <script>` sets cwd to the workspace directory, not the repo root, so `path.resolve(process.cwd(), "apps/api/...")` only worked by coincidence for Docker/`bootstrap.sh` (which invoke `node` from the repo root) and broke `npm run dev:api`/`dev:web` outright.
- Before treating a design-system component attribute as done, verify it is actually read by the component's JS/CSS. `fanta-badge`'s `tone` and `fanta-stat-card`'s `trend` were accepted in markup across every page but had zero visual effect until wired up; `fanta-button` always rendered a hardcoded `type="button"`, so it could never submit a host `<form>`.
- `curl`-based verification of server-rendered HTML only proves the markup shipped; it cannot catch client-side bugs (Shadow DOM render errors, JS that never fires). Two real bugs — `handlebars-loader` leaking compiled-template source into every Web Component's Shadow DOM, and `<fanta-button type="submit">` never actually submitting its host `<form>` because a shadow-DOM `<button>` doesn't cross the shadow boundary for native form association without `ElementInternals` — were both invisible to curl and only surfaced once a real browser (`claude-in-chrome`) actually clicked the button. Any UI change involving Web Components or client-side JS needs an actual browser check, not just an HTTP-level one.
- The 2026/27 Listone acquisition path is resolved: `POST /v1/sources/fantacalcio/listone` (see ADR-0005) bulk-parses the single `quotazioni-fantacalcio` page (~500 players, role/team/quotation/FVM in one request) rather than scraping per-player detail pages.
- **Minutes played do not exist in any available source.** Verified 2026-08-10 on both the bulk stats page and the player detail pages: Fantacalcio.it exposes PV (matches with a vote), MV, FM and cumulative Titolare/Entrato/… percentages — never minutes. Any formula shaped like `minutesPlayed / 900` (the original early-season weight) is built on a value nothing can populate; the evidence unit is PV.
- **Zero is a sentinel in several source fields, never a measurement.** FPEDIA `algorithmScore = 0` means "not computed yet" (8/435 players, all new arrivals with consecutive fresh fpediaIds; the lowest genuine ALG across the dataset is 26) and FPEDIA season `Fanta Media = 0.00` / `nd` means "no fantavoto exists" (e.g. 29 appearances in a foreign league). Treating either as a real value collapsed technical scores to 0 and wrecked the recommended bid. Rule: keep the raw value, add explicit usability/status semantics, never coerce to an invented neutral (0/50/60).
- **FPEDIA FCP = 30 is a floor**, not a rating: 11/435 players sit exactly at 30 with nothing below and a gap to 40, and the group includes Juventus's marquee signing (ALG 71). Read it as "page not yet editorially reviewed" and fall back to ALG with reduced confidence.
- FCP and ALG are two DISTINCT editorial signals and must never be merged into a generic "score": they correlate only moderately (Pearson 0.55 / Spearman 0.57 globally on 427 players), so both carry information, and their disagreement is itself a confidence signal.
- Both `/quotazioni-fantacalcio` and `/statistiche-serie-a` are server-rendered bulk pages whose player links carry the same `fantacalcioPlayerId` — every Fantacalcio.it dataset joins onto the canonical identity with zero name matching. Check for a bulk page before ever designing a ~500-request per-player collector.
- Risk and confidence are different questions ("how risky is he?" vs "how much do we trust our estimate?") and must stay separate fields: high-risk/high-confidence and low-risk/low-confidence are both legitimate, common states.
- Tier/cliff detection must be RELATIVE to each role's own gap structure. Blended v2 scores are near-continuous (role C: max gap 2.81 across 147 players), so any absolute point threshold either never fires or fires everywhere; a median-gap multiple works, while mean+σ gets blinded by a single large cliff.
- When restarting local dev servers after `docker compose down`, verify with `docker ps`/`lsof -iTCP:<port> -sTCP:LISTEN`, not just the CLI's printed output — a `docker compose down` that only tears down one of several services (seen here: only `redis` was reported stopped, `api`/`web` silently kept running) leaves the old container quietly answering on the same port, and `npm run dev:*` fails to bind but that failure is easy to miss in background output.
