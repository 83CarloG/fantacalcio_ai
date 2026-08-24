"use strict";
const database = require("../../drivers/database");

/**
 * Insert or update one player's stat line for one matchday. Where the actual per-round
 * source (which site, what parsing) comes from is intentionally NOT decided here — this
 * only defines the storage shape and lets a caller (admin upload, future collector, CLI)
 * feed it pre-parsed records. See features/importMatchdayStats.js.
 */
module.exports = async function upsertMatchdayStat({playerId, matchdayNumber, minutesPlayed = null, vote = null, goals = null, assists = null}) {
    database().prepare(`
        INSERT INTO matchday_stats(player_id, matchday_number, minutes_played, vote, goals, assists, imported_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(player_id, matchday_number) DO UPDATE SET
            minutes_played = excluded.minutes_played,
            vote = excluded.vote,
            goals = excluded.goals,
            assists = excluded.assists,
            imported_at = excluded.imported_at
    `).run(playerId, matchdayNumber, minutesPlayed, vote, goals, assists, new Date().toISOString());
};
