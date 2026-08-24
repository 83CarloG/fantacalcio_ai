"use strict";
const database = require("../../drivers/database");

/**
 * A dataset snapshot header plus everything pinned to it — the reproducibility read path:
 * exactly what the app knew (Listone/FPEDIA data + computed indicators) at the moment this
 * snapshot was created, unaffected by any ingestion/recalculation that happened since.
 */
module.exports = async function getDatasetSnapshot(id) {
    const db = database();
    const header = db.prepare(`
        SELECT id, label, snapshot_type, algorithm_version, matchdays_included, created_at, locked_at, notes
        FROM dataset_snapshots WHERE id = ?
    `).get(Number(id));
    if (!header) return null;

    const players = db.prepare(`SELECT player_id, payload_json FROM player_snapshots WHERE dataset_snapshot_id = ?`).all(header.id);
    const indicators = db.prepare(`SELECT player_id, payload_json FROM indicator_snapshots WHERE dataset_snapshot_id = ?`).all(header.id);
    return {
        ...header,
        players: players.map((row) => ({playerId: row.player_id, payload: JSON.parse(row.payload_json)})),
        indicators: indicators.map((row) => ({playerId: row.player_id, payload: JSON.parse(row.payload_json)}))
    };
};
