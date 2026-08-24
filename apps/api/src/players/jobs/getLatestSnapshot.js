"use strict";
const database = require("../../drivers/database");

/**
 * Latest snapshot row for a player. By default this is the newest row of ANY snapshot_type
 * (used e.g. by the player detail page, which just wants "whatever we last learned").
 * Pass `excludeTypes` to skip snapshot types that don't carry the shape a caller needs —
 * e.g. indicators need FPEDIA-style nested data, not a bare LISTONE_IMPORT pricing snapshot
 * (see indicators/services/getPlayerIndicators.js). Legacy rows with no snapshot_type
 * (pre-migration seed data) are never excluded, since they predate the LISTONE_IMPORT type
 * and already carry the full nested shape.
 */
module.exports = async function getLatestSnapshot(playerId, {excludeTypes = []} = {}) {
    const db = database();
    if (excludeTypes.length === 0) {
        const row = db.prepare(`
            SELECT payload_json FROM player_snapshots WHERE player_id = ? ORDER BY observed_at DESC LIMIT 1
        `).get(Number(playerId));
        return row ? JSON.parse(row.payload_json) : null;
    }
    const placeholders = excludeTypes.map(() => "?").join(",");
    const row = db.prepare(`
        SELECT payload_json FROM player_snapshots
        WHERE player_id = ? AND (snapshot_type IS NULL OR snapshot_type NOT IN (${placeholders}))
        ORDER BY observed_at DESC LIMIT 1
    `).get(Number(playerId), ...excludeTypes);
    return row ? JSON.parse(row.payload_json) : null;
};
