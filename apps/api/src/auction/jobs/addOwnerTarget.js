"use strict";
const database = require("../../drivers/database");

/** Mark one player as a nomination target for the season — idempotent (a repeat marks the same row, doesn't duplicate). */
module.exports = async function addOwnerTarget(season, playerId) {
    database().prepare(`
        INSERT INTO owner_targets(season, player_id, created_at) VALUES (?, ?, ?)
        ON CONFLICT(season, player_id) DO NOTHING
    `).run(season, playerId, new Date().toISOString());
    return {season, playerId};
};
