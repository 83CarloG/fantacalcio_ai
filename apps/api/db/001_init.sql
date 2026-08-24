CREATE TABLE IF NOT EXISTS players (
    player_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    team TEXT,
    role TEXT,
    quotation_classic INTEGER,
    fvm_classic INTEGER,
    quotation_mantra INTEGER,
    fvm_mantra INTEGER
);
CREATE TABLE IF NOT EXISTS player_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    observed_at TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    FOREIGN KEY(player_id) REFERENCES players(player_id)
);
CREATE TABLE IF NOT EXISTS auction_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season TEXT NOT NULL,
    player_id INTEGER,
    player_name TEXT NOT NULL,
    role TEXT,
    manager_id TEXT,
    price REAL NOT NULL,
    payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS market_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    payload_json TEXT NOT NULL
);
