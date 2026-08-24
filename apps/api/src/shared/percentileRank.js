"use strict";

/**
 * Percentile rank (0-100) of a value within a distribution, ties counted half — the
 * standard mid-rank convention, so a value equal to every other lands at 50, the maximum
 * lands near 100 and the minimum near 0. Generic utility (Luminous /shared, callable from
 * any layer like normalizePlayerName/median/parseProjectionRange).
 *
 * @param {number} value
 * @param {Array<number>} distribution
 * @return {?number} null when the distribution is empty or value is not finite
 */
module.exports = function percentileRank(value, distribution) {
    if (!Number.isFinite(value) || !distribution || distribution.length === 0) return null;
    let less = 0;
    let equal = 0;
    for (const other of distribution) {
        if (other < value) less += 1;
        else if (other === value) equal += 1;
    }
    return Number(((less + equal * 0.5) / distribution.length * 100).toFixed(2));
};
