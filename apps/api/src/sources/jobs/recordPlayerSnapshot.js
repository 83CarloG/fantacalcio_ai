"use strict";
const database = require("../../drivers/database");

/** Append one PLAYER-level snapshot row. Snapshots are never updated in place, only inserted. */
module.exports = async function recordPlayerSnapshot({playerId, snapshotType, payload, datasetSnapshotId = null}) {
    const db = database();
    db.prepare(`
        INSERT INTO player_snapshots(player_id, observed_at, payload_json, snapshot_type, dataset_snapshot_id)
        VALUES (?, ?, ?, ?, ?)
    `).run(playerId, new Date().toISOString(), JSON.stringify(payload), snapshotType, datasetSnapshotId);
};
