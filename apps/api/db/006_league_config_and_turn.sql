-- Season-configurable league parameters (so next season doesn't need a code change), the
-- "which manager am I" flag, the fixed calling order, and the live call-turn pointer.
-- Deliberately does NOT touch the indicators calculation path (buildRoleContext.js,
-- calculateRelativeValue.js keep reading the static apps/api/src/shared/leagueRules.js) —
-- only the auction/league side (defaults, roster-slot targets shown in the UI, the
-- nomination-suggestion engine) reads season_rules. See LEARNED.md if that divergence
-- ever needs resolving.
CREATE TABLE IF NOT EXISTS season_rules (
    season TEXT PRIMARY KEY,
    participants INTEGER NOT NULL,
    budget_per_manager INTEGER NOT NULL,
    roster_slots_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- ALTER ... ADD COLUMN has no IF NOT EXISTS in SQLite; migrate.js runs each individually
-- and ignores "duplicate column" so re-running this file stays idempotent (see 002's note).
ALTER TABLE managers ADD COLUMN is_owner INTEGER NOT NULL DEFAULT 0;
ALTER TABLE managers ADD COLUMN call_order INTEGER NOT NULL DEFAULT 0;

-- The live "whose turn is it to call a player" pointer. One row per season, not an event
-- log: there is no need to remember who called what, only who is up now — the operator
-- advances this explicitly (see jobs/advanceTurn.js).
CREATE TABLE IF NOT EXISTS auction_turn (
    season TEXT PRIMARY KEY,
    current_caller_manager_id INTEGER REFERENCES managers(id)
);

-- The owner's live-auction nomination watchlist: players flagged as targets, read by the
-- "Cosa chiamo?" suggestion panel.
CREATE TABLE IF NOT EXISTS owner_targets (
    season TEXT NOT NULL,
    player_id INTEGER NOT NULL REFERENCES players(player_id),
    created_at TEXT NOT NULL,
    PRIMARY KEY (season, player_id)
);
