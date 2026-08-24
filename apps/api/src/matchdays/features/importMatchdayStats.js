"use strict";
const upsertMatchdayStat = require("../jobs/upsertMatchdayStat");

/**
 * Persist a batch of pre-parsed per-player stat lines for one matchday. This is
 * deliberately source-agnostic (see jobs/upsertMatchdayStat.js): the collector that turns a
 * Fantacalcio.it matchday page into these records is a separate, not-yet-designed piece of
 * work. Feeds the storage layer only — does NOT touch indicators (see
 * indicators/jobs/calculateEarlySeasonWeight.js: wiring real minutesPlayed into the
 * early-season blend requires a formula decision the current task explicitly leaves open,
 * so `matchday_stats` is populated but not yet consumed by indicator computation).
 *
 * @param {number} matchdayNumber
 * @param {Array<{playerId:number, minutesPlayed?:number, vote?:number, goals?:number, assists?:number}>} stats
 * @return {number} how many rows were written
 */
module.exports = async function importMatchdayStats(matchdayNumber, stats) {
    for (const stat of stats) {
        await upsertMatchdayStat({...stat, matchdayNumber});
    }
    return stats.length;
};
