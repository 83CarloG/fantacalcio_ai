"use strict";
const collectFantacalcioSeasonStats = require("../operations/collectFantacalcioSeasonStats");
const upsertSeasonStatSnapshot = require("../jobs/upsertSeasonStatSnapshot");
const listAllPlayerIds = require("../../players/jobs/listAllPlayerIds");

/**
 * Import the cumulative season stats for every player in one pass (single bulk request).
 *
 * `as_of_matchday` is SELF-DESCRIBING from the data: the max PV (matches with a vote)
 * across all players — after G3 the ever-presents have PV=3. No user input, no drift; and
 * re-importing after Fantacalcio.it consolidates a giornata's votes lands on the SAME
 * matchday row (upsert), which is exactly the "data is final only after consolidation"
 * behaviour the lifecycle decision asked for. An explicit override remains for the CLI.
 * Before the season starts every PV is 0 → nothing is written ("season not started").
 *
 * Rows for player ids not in our table (the stats page can list a couple of extra players
 * vs the listone) are counted and skipped — Fantacalcio.it listone stays the canonical
 * eligibility source.
 */
module.exports = async function importSeasonStats(url, matchdayOverride = null) {
    const rows = await collectFantacalcioSeasonStats(url);
    const asOfMatchday = matchdayOverride ?? Math.max(0, ...rows.map((row) => row.pv || 0));
    if (asOfMatchday === 0) {
        return {imported: 0, skippedUnknown: 0, asOfMatchday: 0, seasonStarted: false, importedAt: new Date().toISOString()};
    }

    const knownIds = new Set(await listAllPlayerIds());
    let imported = 0;
    let skippedUnknown = 0;
    for (const row of rows) {
        if (!knownIds.has(row.fantacalcioPlayerId)) { skippedUnknown += 1; continue; }
        await upsertSeasonStatSnapshot({playerId: row.fantacalcioPlayerId, asOfMatchday, ...row});
        imported += 1;
    }
    return {imported, skippedUnknown, asOfMatchday, seasonStarted: true, importedAt: new Date().toISOString()};
};
