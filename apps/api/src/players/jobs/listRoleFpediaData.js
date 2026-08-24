"use strict";
const database = require("../../drivers/database");

/**
 * Every ACTIVE player of a role with its LATEST FPEDIA_REFRESH snapshot (players re-enriched
 * over time accumulate several), parsed. Players never enriched are absent — the indicator
 * pipeline treats them as "no data yet", not as zeros. The snapshot id travels along so
 * derived indicators can record their exact provenance (`sourceSnapshotIds`).
 *
 * @param {string} role
 * @return {Array<{playerId:number, snapshotId:number, data:object}>}
 */
module.exports = async function listRoleFpediaData(role) {
    const rows = database().prepare(`
        SELECT p.player_id AS playerId, ps.id AS snapshotId, ps.payload_json
        FROM players p
        JOIN player_snapshots ps ON ps.id = (
            SELECT id FROM player_snapshots
            WHERE player_id = p.player_id AND snapshot_type = 'FPEDIA_REFRESH'
            ORDER BY observed_at DESC, id DESC LIMIT 1
        )
        WHERE p.status = 'ACTIVE' AND p.role = ?
    `).all(role);
    return rows.map((row) => {
        const payload = JSON.parse(row.payload_json);
        return {
            playerId: row.playerId,
            snapshotId: row.snapshotId,
            data: (payload.sources && payload.sources.fpedia && payload.sources.fpedia.data) || {}
        };
    });
};
