-- Live-auction tracking: who's in the league this season, and what each of them actually
-- paid for each player as the real auction happens. Separate from `auction_transactions`
-- (bulk-imported 2025/26 history, never written at runtime, free-text manager_id, no FK) —
-- mixing a frozen historical import with a live-editable current-season ledger in one table
-- would conflate two different provenances the same way this schema deliberately keeps
-- apart everywhere else (see 004_source_import_runs.sql's header comment).

CREATE TABLE IF NOT EXISTS managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season TEXT NOT NULL,
    name TEXT NOT NULL,
    budget_total INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(season, name)
);

-- UNIQUE(season, player_id) guards against recording the same player twice by mistake
-- during a fast-moving live auction; a wrong entry is deleted and re-recorded (see
-- jobs/deleteAuctionPick.js), never silently overwritten.
CREATE TABLE IF NOT EXISTS live_auction_picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season TEXT NOT NULL,
    manager_id INTEGER NOT NULL REFERENCES managers(id),
    player_id INTEGER NOT NULL REFERENCES players(player_id),
    price INTEGER NOT NULL,
    recorded_at TEXT NOT NULL,
    UNIQUE(season, player_id)
);
CREATE INDEX IF NOT EXISTS idx_live_auction_picks_manager ON live_auction_picks(manager_id);
