"use strict";

// recency weight by ACTUAL season gap (years since the most recent season in `history`),
// not array position — explicit and UNCALIBRATED: chosen so the latest season dominates
// without erasing the older ones, per the requirement that a 30-appearance MV 6.40 season
// outweighs a 4-appearance MV 6.60 one (the appearance reliability factor below is what
// enforces that, not recency alone). Gap-based rather than index-based because `history`
// can have holes (a season the player wasn't tracked for — long injury, loan to an
// untracked league): the second ARRAY entry is not reliably "one year ago".
const RECENCY_WEIGHT_BY_GAP = {0: 0.6, 1: 0.3, 2: 0.1};
const DEFAULT_RECENCY_WEIGHT = 0.05;

function seasonStartYear(season) {
    const match = /^(\d{4})/.exec(season || "");
    return match ? Number(match[1]) : null;
}

/**
 * Weighted historical fantasy average from FPEDIA season history. Each season with a REAL
 * averageVote (sentinels "nd"/"0.00" were already parsed to null upstream — see
 * sources/jobs/parseFpediaPlayerDetail.js) contributes recencyWeight × min(1, appearances/38).
 * No usable season → weightedMv null (never 0/50/60 invented); the caller reduces
 * confidence, not the technical score.
 *
 * @param {?Array<{season:string, averageVote:?number, appearances:?number}>} history
 *        most recent season first, as parsed
 * @return {{weightedMv:?number, hasHistory:boolean, maxAppearances:number}}
 */
module.exports = function calculateHistoricalMv(history) {
    const seasons = (history || []).filter((s) => s.averageVote !== null && s.averageVote !== undefined);
    const maxAppearances = Math.max(0, ...(history || []).map((s) => s.appearances || 0).filter((n) => Number.isFinite(n)));
    if (seasons.length === 0) return {weightedMv: null, hasHistory: false, maxAppearances};

    const mostRecentYear = seasonStartYear((history || [])[0] && (history || [])[0].season);

    let weightedSum = 0;
    let weightTotal = 0;
    (history || []).forEach((season) => {
        if (season.averageVote === null || season.averageVote === undefined) return;
        const seasonYear = seasonStartYear(season.season);
        const gap = (mostRecentYear != null && seasonYear != null) ? mostRecentYear - seasonYear : null;
        const recency = (gap != null && RECENCY_WEIGHT_BY_GAP[gap] !== undefined) ? RECENCY_WEIGHT_BY_GAP[gap] : DEFAULT_RECENCY_WEIGHT;
        const reliability = Math.min(1, (season.appearances || 0) / 38);
        const weight = recency * reliability;
        weightedSum += season.averageVote * weight;
        weightTotal += weight;
    });
    if (weightTotal === 0) return {weightedMv: null, hasHistory: false, maxAppearances};
    return {weightedMv: Number((weightedSum / weightTotal).toFixed(3)), hasHistory: true, maxAppearances};
};
