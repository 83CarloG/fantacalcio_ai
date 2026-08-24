"use strict";
const database = require("../../drivers/database");

/**
 * Insert or update one player's cumulative stat line as of a given matchday. Re-importing
 * the same matchday overwrites in place (Fantacalcio.it consolidates votes after a delay);
 * different matchdays append, preserving the pre-auction evolution.
 */
module.exports = async function upsertSeasonStatSnapshot({playerId, asOfMatchday, pv, mv, fm, gol, gs, rigRaw, rp, ass, amm, esp, penaltiesRaw}) {
    database().prepare(`
        INSERT INTO season_stat_snapshots(player_id, as_of_matchday, pv, mv, fm, gol, gs, rig, rp, ass, amm, esp, penalties_raw, imported_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(player_id, as_of_matchday) DO UPDATE SET
            pv = excluded.pv, mv = excluded.mv, fm = excluded.fm,
            gol = excluded.gol, gs = excluded.gs, rig = excluded.rig, rp = excluded.rp,
            ass = excluded.ass, amm = excluded.amm, esp = excluded.esp,
            penalties_raw = excluded.penalties_raw, imported_at = excluded.imported_at
    `).run(playerId, asOfMatchday, pv, mv, fm, gol, gs, rigRaw, rp, ass, amm, esp, penaltiesRaw, new Date().toISOString());
};
