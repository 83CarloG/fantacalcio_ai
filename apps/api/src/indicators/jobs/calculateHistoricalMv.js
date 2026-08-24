"use strict";

// recency weights, most recent season first — explicit and UNCALIBRATED: chosen so the
// latest season dominates without erasing the older ones, per the requirement that a
// 30-appearance MV 6.40 season outweighs a 4-appearance MV 6.60 one (the appearance
// reliability factor below is what enforces that, not recency alone)
const RECENCY_WEIGHTS = [0.6, 0.3, 0.1];

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

    let weightedSum = 0;
    let weightTotal = 0;
    (history || []).forEach((season, index) => {
        if (season.averageVote === null || season.averageVote === undefined) return;
        const recency = RECENCY_WEIGHTS[index] ?? 0.05;
        const reliability = Math.min(1, (season.appearances || 0) / 38);
        const weight = recency * reliability;
        weightedSum += season.averageVote * weight;
        weightTotal += weight;
    });
    if (weightTotal === 0) return {weightedMv: null, hasHistory: false, maxAppearances};
    return {weightedMv: Number((weightedSum / weightTotal).toFixed(3)), hasHistory: true, maxAppearances};
};
