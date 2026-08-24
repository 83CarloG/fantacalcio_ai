"use strict";
const cheerio = require("cheerio");

/**
 * Parse one FantaCalcioPedia role-index page (e.g. .../lista-calciatori-serie-a/portieri/)
 * into a flat array of player entries. Pure/deterministic, unit-testable against a saved
 * HTML fixture. Confirmed live on 2026-08-10: all players for a role are listed on a single
 * unpaginated page inside `div.col_full.giocatore` cards.
 *
 * @param {string} html
 * @return {Array<{fpediaId:number, fullName:string, team:?string, roleLabel:?string, url:string}>}
 */
module.exports = function parseFpediaPlayerIndex(html) {
    const $ = cheerio.load(html);
    const players = [];

    $("div.col_full.giocatore").each(function () {
        const card = $(this);
        const href = card.find("a[href]").first().attr("href") || "";
        const idMatch = href.match(/\/(\d+)\/[^/]+\.html$/);
        if (!idMatch) return; // no identifiable fpedia id: skip rather than guess

        players.push({
            fpediaId: Number(idMatch[1]),
            fullName: card.find("h3.tit_calc").first().text().trim(),
            team: card.find("small").first().text().trim() || null,
            roleLabel: card.find("span.label").first().text().trim() || null,
            url: href
        });
    });

    return players;
};
