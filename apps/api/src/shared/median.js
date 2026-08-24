"use strict";

/**
 * Median of a numeric array. Generic/non-business utility (Luminous "modular monolith"
 * `/shared` — see docs/reference/LUMINOUS_ARCHITECTURE.md); deliberately NOT under a
 * `jobs/` subfolder so it isn't classified as a layer by scripts/check-luminous-boundaries.js.
 *
 * @param {Array<number>} values
 * @return {?number} null for an empty array
 */
module.exports = function median(values) {
    if (!values || values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};
