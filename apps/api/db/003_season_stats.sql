-- Cumulative season statistics per player, one row per (player, as_of_matchday), imported
-- from the Fantacalcio.it bulk stats page after each pre-auction giornata. Re-importing the
-- same matchday (e.g. after Fantacalcio.it consolidates votes) upserts in place; a new
-- matchday appends — so the pre-auction evolution G1..G5 stays fully reconstructable.
-- `rig` and `penalties_raw` are stored as RAW TEXT: their exact semantics (scored vs
-- attempted; whether Gol already includes penalties) cannot be verified until G1 — parsing
-- them into numbers now would bake in a guess (see the Indicator Model v2 plan, G1 gate).
CREATE TABLE IF NOT EXISTS season_stat_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(player_id),
    as_of_matchday INTEGER NOT NULL,
    pv INTEGER,
    mv REAL,
    fm REAL,
    gol INTEGER,
    gs INTEGER,
    rig TEXT,
    rp INTEGER,
    ass INTEGER,
    amm INTEGER,
    esp INTEGER,
    penalties_raw TEXT,
    imported_at TEXT NOT NULL,
    UNIQUE(player_id, as_of_matchday)
);
