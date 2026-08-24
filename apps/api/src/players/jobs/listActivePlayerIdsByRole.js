"use strict";
const database = require("../../drivers/database");

/** Active same-role peers, excluding the given player — used to build a replacement-level pool. */
module.exports = async function listActivePlayerIdsByRole(role, excludePlayerId) {
    return database().prepare(`
        SELECT player_id FROM players WHERE role = ? AND status = 'ACTIVE' AND player_id != ?
    `).all(role, excludePlayerId).map((row) => row.player_id);
};
