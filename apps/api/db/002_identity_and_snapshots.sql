-- Player identity resolution (display/full/normalized name, per-source mapping),
-- resumable FPEDIA enrichment state, and the snapshot/dataset lineage needed to
-- reconstruct exactly what the app knew at POST_MARKET_BASELINE / AUCTION_SNAPSHOT time.
-- SQLite has no native ADD COLUMN IF NOT EXISTS, so each ALTER is guarded in migrate.js.

CREATE TABLE IF NOT EXISTS player_source_identities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(player_id),
    source TEXT NOT NULL,
    source_id TEXT,
    source_url TEXT,
    raw_name TEXT,
    match_method TEXT NOT NULL,
    matched_at TEXT NOT NULL,
    UNIQUE(player_id, source)
);

CREATE TABLE IF NOT EXISTS player_source_sync_state (
    player_id INTEGER NOT NULL REFERENCES players(player_id),
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT,
    last_error TEXT,
    next_retry_at TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(player_id, source)
);

CREATE TABLE IF NOT EXISTS dataset_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL UNIQUE,
    snapshot_type TEXT NOT NULL,
    algorithm_version TEXT NOT NULL,
    matchdays_included INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    locked_at TEXT NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS indicator_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(player_id),
    computed_at TEXT NOT NULL,
    algorithm_version TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    dataset_snapshot_id INTEGER REFERENCES dataset_snapshots(id)
);

-- Matchday stats storage only: the actual per-giornata collector (source, parsing)
-- is out of scope here and needs its own design pass before this table gets populated.
CREATE TABLE IF NOT EXISTS matchday_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(player_id),
    matchday_number INTEGER NOT NULL,
    minutes_played INTEGER,
    vote REAL,
    goals INTEGER,
    assists INTEGER,
    imported_at TEXT NOT NULL,
    UNIQUE(player_id, matchday_number)
);

-- ALTER ... ADD COLUMN has no IF NOT EXISTS in SQLite; migrate.js runs each of these
-- individually and ignores "duplicate column" so re-running this file stays idempotent.
ALTER TABLE players ADD COLUMN display_name TEXT;
ALTER TABLE players ADD COLUMN full_name TEXT;
ALTER TABLE players ADD COLUMN normalized_name TEXT;
ALTER TABLE players ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE players ADD COLUMN last_seen_at TEXT;
ALTER TABLE player_snapshots ADD COLUMN snapshot_type TEXT;
ALTER TABLE player_snapshots ADD COLUMN dataset_snapshot_id INTEGER REFERENCES dataset_snapshots(id);
