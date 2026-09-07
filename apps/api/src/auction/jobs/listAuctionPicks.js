"use strict";
const database = require("../../drivers/database");

/** Every pick recorded so far this season, most recent first, with player/manager names joined in for display. */
module.exports = async function listAuctionPicks(season) {
    return database().prepare(`
        SELECT
            lap.id, lap.manager_id AS managerId, lap.player_id AS playerId, lap.price, lap.recorded_at AS recordedAt,
            m.name AS managerName,
            p.name AS playerName, p.team AS playerTeam, p.role AS playerRole
        FROM live_auction_picks lap
        JOIN managers m ON m.id = lap.manager_id
        JOIN players p ON p.player_id = lap.player_id
        WHERE lap.season = ?
        ORDER BY lap.id DESC
    `).all(season);
};
