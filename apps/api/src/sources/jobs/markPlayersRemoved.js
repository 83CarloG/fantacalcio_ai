"use strict";
const database = require("../../drivers/database");

/**
 * Flip every currently-ACTIVE player not present in this listone import to REMOVED. Never
 * deletes a row: `player_snapshots`/`indicator_snapshots`/auction transactions carry FKs on
 * `player_id`, and a removed player may legitimately come back in a later import.
 *
 * @param {Array<number>} currentPlayerIds ids present in the just-completed listone import
 * @return {number} how many players were newly marked REMOVED
 */
module.exports = async function markPlayersRemoved(currentPlayerIds) {
    const db = database();
    // `player_id NOT IN (NULL)` is never true in SQL (NULL-in-list makes the whole
    // comparison UNKNOWN for every row) — an empty list needs its own query, not a "NULL"
    // placeholder fallback, or this silently updates zero rows instead of every active player.
    const result = currentPlayerIds.length === 0
        ? db.prepare(`UPDATE players SET status = 'REMOVED' WHERE status = 'ACTIVE'`).run()
        : db.prepare(`
            UPDATE players SET status = 'REMOVED'
            WHERE status = 'ACTIVE' AND player_id NOT IN (${currentPlayerIds.map(() => "?").join(",")})
        `).run(...currentPlayerIds);
    return result.changes;
};
