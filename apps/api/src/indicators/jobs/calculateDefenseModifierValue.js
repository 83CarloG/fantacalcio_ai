"use strict";
const leagueRules = require("../../shared/leagueRules");

/**
 * Expected per-game defense-modifier contribution for P/D, from the weighted historical MV
 * mapped onto OUR league's real thresholds (6→+0.5 … ≥7→+2.5). INFORMATIONAL ONLY, zero
 * weight in every aggregate: the modifier needs ≥4 fielded defenders and the user's habitual
 * formation is 3-4-3, so it is almost never active for them — displayed so the option stays
 * visible, never a reason to overpay high-MV defenders.
 *
 * @param {{role:?string, weightedMv:?number}} input
 * @return {?number} null for C/A or when no historical MV exists (nothing invented)
 */
module.exports = function calculateDefenseModifierValue({role, weightedMv}) {
    if (role !== "P" && role !== "D") return null;
    if (weightedMv == null) return null;
    for (const threshold of leagueRules.defenseModifierThresholds) {
        if (weightedMv >= threshold.minAverage) return threshold.value;
    }
    return 0;
};
