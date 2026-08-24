"use strict";
const cheerio = require("cheerio");

/**
 * Parse the Fantacalcio.it "Quotazioni" page — one row per Serie A player, with both
 * classic and Mantra pricing — into a flat array of player records. Pure/deterministic:
 * no I/O, so it is unit-testable against a saved HTML fixture.
 *
 * @param {string} html raw HTML of https://www.fantacalcio.it/quotazioni-fantacalcio
 * @return {Array<{fantacalcioPlayerId:number, name:string, team:?string, role:?string,
 *   quotationClassic:?number, fvmClassic:?number, quotationMantra:?number, fvmMantra:?number,
 *   fantacalcioUrl:?string}>}
 */
module.exports = function parseFantacalcioListone(html) {
    const $ = cheerio.load(html);

    // the team filter <select> doubles as a teamId -> full team name lookup; the row
    // markup itself only carries an abbreviated 3-letter code (e.g. "INT" for Inter)
    const teamNameById = {};
    $("select#team option[value]").each(function () {
        const id = $(this).attr("value");
        if (id) teamNameById[id] = $(this).text().trim();
    });

    const players = [];
    $("tr.player-row").each(function () {
        const row = $(this);
        const link = row.find(".player-name a.player-link");
        const playerIdMatch = (link.attr("href") || "").match(/(\d+)\/?$/);
        if (!playerIdMatch) return; // no identifiable player id: skip rather than guess

        const teamId = row.attr("data-filter-team-id");
        const role = (row.attr("data-filter-role-classic") || "").toUpperCase() || null;

        // a cell may be legitimately blank (e.g. a player with no current quotation)
        const number = function (selector) {
            const text = row.find(selector).text().trim();
            return text === "" ? null : Number(text);
        };

        players.push({
            fantacalcioPlayerId: Number(playerIdMatch[1]),
            name: link.text().trim(),
            team: teamNameById[teamId] || null,
            role,
            quotationClassic: number(".player-classic-current-price"),
            fvmClassic: number(".player-classic-fvm"),
            quotationMantra: number(".player-mantra-current-price"),
            fvmMantra: number(".player-mantra-fvm"),
            fantacalcioUrl: link.attr("href") || null
        });
    });

    return players;
};
