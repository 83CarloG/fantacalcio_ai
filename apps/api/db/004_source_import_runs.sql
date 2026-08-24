-- Run ledger for long-running source imports triggered over HTTP.
-- The listone import is a live ~1MB fetch, ~500 player upserts + ~500 snapshot inserts and
-- a per-player identity reconciliation that can itself fall back to one detail-page fetch
-- per unmatched player. That is minutes of work, so it cannot be answered inside a single
-- synchronous request (the Web BFF's HTTP driver gives up after 20s). The route now starts
-- the run, returns 202 and the caller polls the latest row for this import_type.
-- One row per attempt, never updated except to close it out: a FAILED run stays on record
-- next to the SUCCESS that followed it, so "when did the listone last actually land?" and
-- "what broke last night?" are both answerable after the fact.
CREATE TABLE IF NOT EXISTS source_import_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_type TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    result_json TEXT,
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_source_import_runs_type_id ON source_import_runs(import_type, id DESC);
