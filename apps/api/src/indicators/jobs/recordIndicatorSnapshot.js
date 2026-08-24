"use strict";
const database = require("../../drivers/database");

/** Append one INDICATOR-level snapshot row. Never updated in place, only inserted. */
module.exports = async function recordIndicatorSnapshot({playerId, algorithmVersion, payload, datasetSnapshotId = null}) {
    database().prepare(`
        INSERT INTO indicator_snapshots(player_id, computed_at, algorithm_version, payload_json, dataset_snapshot_id)
        VALUES (?, ?, ?, ?, ?)
    `).run(playerId, new Date().toISOString(), algorithmVersion, JSON.stringify(payload), datasetSnapshotId);
};
