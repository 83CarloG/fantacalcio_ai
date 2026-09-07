"use strict";
const median = require("../../shared/median");

// tier cliff detection — deterministic, explicit, UNCALIBRATED. A gap is a significant
// cliff when ≥ max(1.5 × median gap, 0.5 points); of the significant cliffs, at most the 5
// LARGEST become tier boundaries (≤6 tiers). Significance is RELATIVE to the role's own
// gap structure: v2 blended scores are near-continuous (live check 2026-08-10: C role max
// gap 2.81 across 147 players), so any absolute threshold either fires never (dense roles
// all "tier 1") or everywhere. Median-based rather than mean+σ because one huge cliff would
// inflate σ and mask real smaller cliffs next to it (caught by the tier unit test).
const TIER_SIGNIFICANCE_FACTOR = 1.5;
const TIER_MIN_SIGNIFICANT_GAP = 0.5;
const MAX_TIERS = 6;
// alternatives window: players within ±5 technical points count as substitutes; scarcity is
// damped by how many exist (5/(5+n)) — a great player with 10 near-equals is less scarce
// than one with none. Explicit, UNCALIBRATED.
const ALTERNATIVES_WINDOW = 5;

function tierBoundaries(sortedScores) {
    if (sortedScores.length < 2) return [];
    const gaps = [];
    for (let i = 0; i < sortedScores.length - 1; i++) gaps.push(sortedScores[i] - sortedScores[i + 1]);
    const significance = Math.max(TIER_SIGNIFICANCE_FACTOR * median(gaps), TIER_MIN_SIGNIFICANT_GAP);
    return gaps
        .map((gap, index) => ({gap, index}))
        .filter((candidate) => candidate.gap >= significance)
        .sort((a, b) => b.gap - a.gap || a.index - b.index) // largest cliffs win; ties by position
        .slice(0, MAX_TIERS - 1)
        .sort((a, b) => a.index - b.index)
        .map((candidate) => candidate.index); // boundary AFTER this index
}

/**
 * Relative value of one player within its role, against the REAL roster demand of our
 * league (approved: strict Nth player — with 8 managers the market absorbs exactly
 * P24/D64/C64/A48, so the replacement level is the score of the last player that would get
 * drafted, NOT the role median).
 *
 * - roleRank: 1-based position by technical score
 * - replacementScore: score of the demand-th ranked player (last one if the role has fewer)
 * - vorp: technical − replacement; NEGATIVE IS LEGITIMATE (below-replacement information)
 * - alternativesWithinFive: other role players within ±5 points (density of substitutes)
 * - scarcityIndex: min(100, max(0,vorp)×5) damped by alternatives — compatible with a
 *   future liveScarcity that simply removes already-auctioned players from `rolePlayers`
 * - tier: 1-based tier from deterministic cliff detection on the role's score distribution
 *
 * @param {{playerId:number, rolePlayers:Array<{playerId:number, score:?number}>, demand:number}} input
 * @return {{roleRank:?number, replacementScore:?number, vorp:?number,
 *   alternativesWithinFive:?number, scarcityIndex:?number, tier:?number}}
 */
module.exports = function calculateRelativeValue({playerId, rolePlayers, demand}) {
    const ranked = rolePlayers
        .filter((p) => p.score !== null && p.score !== undefined)
        .sort((a, b) => b.score - a.score);
    const nulls = {roleRank: null, replacementScore: null, vorp: null, alternativesWithinFive: null, scarcityIndex: null, tier: null};
    if (ranked.length === 0) return nulls;
    // `demand` comes from leagueRules.rosterDemand[role] (buildRoleContext.js) and is
    // undefined for any role outside P/D/C/A — the `role` column has no DB constraint, so a
    // null/blank/unnormalized value is possible. Without this guard, ranked[NaN] below
    // throws and aborts the entire bulk recalculation loop for every player queued after it.
    if (demand === null || demand === undefined) return nulls;

    const index = ranked.findIndex((p) => p.playerId === playerId);
    if (index === -1) return nulls; // player has no computable score → no relative value

    const playerScore = ranked[index].score;
    const replacementScore = ranked[Math.min(demand, ranked.length) - 1].score;
    const vorp = Number((playerScore - replacementScore).toFixed(2));
    const alternativesWithinFive = ranked.filter((p) => p.playerId !== playerId && Math.abs(p.score - playerScore) <= ALTERNATIVES_WINDOW).length;
    const scarcityIndex = Number((
        Math.min(100, Math.max(0, vorp) * 5) * (ALTERNATIVES_WINDOW / (ALTERNATIVES_WINDOW + alternativesWithinFive))
    ).toFixed(2));

    const boundaries = tierBoundaries(ranked.map((p) => p.score));
    let tier = 1;
    for (const boundary of boundaries) {
        if (index > boundary) tier += 1;
    }

    return {roleRank: index + 1, replacementScore, vorp, alternativesWithinFive, scarcityIndex, tier};
};
