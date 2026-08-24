"use strict";
// CLI twin of `POST /v1/sources/fantacalcio/season-stats`. Usage:
//   node scripts/import-season-stats.js [matchdayOverride]
// Without an argument as_of_matchday is self-derived from max PV; pass a number to force a
// specific matchday (e.g. re-importing an older consolidation).
const importSeasonStats = require("../src/sources/services/importSeasonStats");
const recalculateIndicators = require("../src/indicators/services/recalculateIndicators");

const override = process.argv[2] ? Number(process.argv[2]) : null;

importSeasonStats(undefined, override).then(async function (result) {
    console.log(JSON.stringify(result, null, 2));
    if (result.seasonStarted) {
        console.log("Recalculating indicators for all active players...");
        console.log(JSON.stringify(await recalculateIndicators.all(), null, 2));
    }
}).catch(function (error) {
    console.error("Season stats import failed:", error.message);
    process.exitCode = 1;
});
