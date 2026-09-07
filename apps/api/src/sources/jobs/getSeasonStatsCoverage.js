"use strict";
const database = require("../../drivers/database");

/**
 * Season-stats coverage at the most recent imported matchday, for the data-health page.
 * `latestMatchday` is null before the season starts (the table is still empty — see
 * LEARNED.md's G1 gate note) rather than 0, so a caller can tell "no matchday yet" apart
 * from "matchday 0 exists".
 */
module.exports = async function getSeasonStatsCoverage() {
    const db = database();
    const total = db.prepare("SELECT COUNT(*) c FROM players WHERE status = 'ACTIVE'").get().c;
    const latestMatchday = db.prepare("SELECT MAX(as_of_matchday) m FROM season_stat_snapshots").get().m;
    if (latestMatchday === null) return {total, latestMatchday: null, atLatestMatchday: 0};
    const atLatestMatchday = db.prepare(`
        SELECT COUNT(*) c
        FROM season_stat_snapshots s
        JOIN players p ON p.player_id = s.player_id
        WHERE s.as_of_matchday = ? AND p.status = 'ACTIVE'
    `).get(latestMatchday).c;
    return {total, latestMatchday, atLatestMatchday};
};
