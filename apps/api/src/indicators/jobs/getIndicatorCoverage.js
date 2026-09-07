"use strict";
const database = require("../../drivers/database");

/** How many ACTIVE players have at least one persisted indicator snapshot, for the setup/admin status view. */
module.exports = async function getIndicatorCoverage() {
    const row = database().prepare(`
        SELECT
            (SELECT COUNT(*) FROM players WHERE status = 'ACTIVE') AS total,
            (SELECT COUNT(DISTINCT i.player_id)
             FROM indicator_snapshots i
             JOIN players p ON p.player_id = i.player_id
             WHERE p.status = 'ACTIVE') AS withIndicators
    `).get();
    return {total: row.total, withIndicators: row.withIndicators};
};
