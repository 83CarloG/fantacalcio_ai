"use strict";
const cheerio = require("cheerio");

// Italian decimal comma ("6,5") and blank cells → null, never NaN or 0
function numberCell(text) {
    const raw = String(text || "").trim();
    if (raw === "") return null;
    const value = Number(raw.replace(",", "."));
    return Number.isFinite(value) ? value : null;
}

/**
 * Parse the Fantacalcio.it bulk season-statistics page (/statistiche-serie-a) — same
 * server-rendered structure as the listone (verified live 2026-08-10: ~505 `tr.player-row`
 * rows, per-column `data-col-key` cells): the player-link href carries the SAME
 * fantacalcioPlayerId as the listone, so rows join onto our canonical identity with zero
 * name matching. Pure/deterministic, unit-testable against a saved fixture.
 *
 * `rig` and the row's `data-penalties` attribute are passed through as RAW STRINGS — their
 * semantics are unverifiable until G1 (see db/003_season_stats.sql) and must not be guessed.
 *
 * @param {string} html
 * @return {Array<{fantacalcioPlayerId:number, pv:?number, mv:?number, fm:?number,
 *   gol:?number, gs:?number, rigRaw:?string, rp:?number, ass:?number, amm:?number,
 *   esp:?number, penaltiesRaw:?string}>}
 */
module.exports = function parseFantacalcioSeasonStats(html) {
    const $ = cheerio.load(html);
    const players = [];

    $("tr.player-row").each(function () {
        const row = $(this);
        const link = row.find(".player-name a.player-link");
        const playerIdMatch = (link.attr("href") || "").match(/(\d+)\/?$/);
        if (!playerIdMatch) return; // no identifiable player id: skip rather than guess

        const cell = (key) => row.find(`[data-col-key="${key}"]`).first().text().trim();

        players.push({
            fantacalcioPlayerId: Number(playerIdMatch[1]),
            pv: numberCell(cell("pg")),
            mv: numberCell(cell("mv")),
            fm: numberCell(cell("mfv")),
            gol: numberCell(cell("gol")),
            gs: numberCell(cell("gs")),
            rigRaw: cell("rig") || null,
            rp: numberCell(cell("rp")),
            ass: numberCell(cell("ass")),
            amm: numberCell(cell("amm")),
            esp: numberCell(cell("esp")),
            penaltiesRaw: row.attr("data-penalties") || null
        });
    });

    return players;
};
