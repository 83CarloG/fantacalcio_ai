"use strict";
const database = require("../../drivers/database");

/** How many ACTIVE players' FPEDIA identity mapping sit in each sync status, for the admin status view. */
module.exports = async function getFpediaSyncStatusCounts() {
    const rows = database().prepare(`
        SELECT s.status AS status, COUNT(*) AS count
        FROM player_source_sync_state s
        JOIN players p ON p.player_id = s.player_id
        WHERE s.source = 'fpedia' AND p.status = 'ACTIVE'
        GROUP BY s.status
    `).all();
    return rows.reduce(function (counts, row) { counts[row.status] = row.count; return counts; }, {});
};
