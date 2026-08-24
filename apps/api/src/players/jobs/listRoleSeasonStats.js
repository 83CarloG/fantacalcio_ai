"use strict";
const database = require("../../drivers/database");

/**
 * Latest cumulative season stats for a role: rows from the most recent imported
 * as_of_matchday (globally — one import covers the whole league at once). Empty before the
 * first in-season import, which keeps the whole early-season pipeline inert pre-season.
 *
 * @param {string} role
 * @return {{matchdaysObserved:number, byPlayerId:Map<number, object>}}
 */
module.exports = async function listRoleSeasonStats(role) {
    const db = database();
    const latest = db.prepare("SELECT MAX(as_of_matchday) AS m FROM season_stat_snapshots").get();
    const matchdaysObserved = latest && latest.m ? latest.m : 0;
    if (matchdaysObserved === 0) return {matchdaysObserved: 0, byPlayerId: new Map()};

    const rows = db.prepare(`
        SELECT s.player_id AS playerId, s.pv, s.mv, s.fm, s.gol, s.gs, s.ass, s.amm, s.esp
        FROM season_stat_snapshots s
        JOIN players p ON p.player_id = s.player_id
        WHERE s.as_of_matchday = ? AND p.role = ?
    `).all(matchdaysObserved, role);
    return {matchdaysObserved, byPlayerId: new Map(rows.map((row) => [row.playerId, row]))};
};
