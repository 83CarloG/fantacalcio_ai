"use strict";

/**
 * Projected bonus production for OUR league (goal +3 / assist +1), 0-100. Base: the
 * role-percentile of league-weighted projected production (already computed by the caller —
 * 3×goalsMid + 1×assistsMid vs the role distribution, so 3 projected goals rank very
 * differently for a D than for an A). Small explicit UNCALIBRATED additions only for tags
 * that add production the projections may not fully price in: Rigorista (+8) and
 * Piazzati (+4). Goleador/Assistman deliberately carry NO numeric weight — they duplicate
 * what the goal/assist projections already measure (and 32/44 Rigoristi are also Goleador,
 * per the co-occurrence check) — they surface as reasons/tags only.
 *
 * @param {{productionPercentile:?number, skills:Array<string>}} input
 * @return {?number}
 */
module.exports = function calculateBonusPotentialScore({productionPercentile, skills = []}) {
    if (productionPercentile == null) return null;
    let score = productionPercentile;
    if (skills.includes("Rigorista")) score += 8;
    if (skills.includes("Piazzati")) score += 4;
    return Number(Math.max(0, Math.min(100, score)).toFixed(2));
};
