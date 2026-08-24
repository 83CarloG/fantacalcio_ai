"use strict";

// how many pre-auction matchdays we plan to observe (auction after ~G4/G5) — the
// denominator that turns "matches with a vote" into a 0..1 evidence fraction
const PLANNED_PRE_AUCTION_MATCHDAYS = 5;

/**
 * How much the early-season evidence weighs against the preseason prior. The old formula
 * (minutesPlayed/900) is retired: MINUTES DO NOT EXIST in any available source (verified on
 * the bulk stats page and the player detail pages, 2026-08-10) and are never invented. The
 * real evidence unit is PV — matches with an actual fantavoto, straight from the bulk stats
 * page — so the weight grows linearly with rated appearances up to the cap:
 *
 *   weight = cap × min(1, PV / 5)     cap: 0.25 established, 0.35 newcomer
 *
 * Explicit and UNCALIBRATED. The caps keep the approved principle: early evidence UPDATES
 * the preseason prior, it never replaces it.
 *
 * @param {{pv:?number, isNewPlayer:boolean}} input pv = matches with a vote so far
 * @return {number} 0..cap
 */
module.exports = async function calculateEarlySeasonWeight({pv = 0, isNewPlayer = false}) {
    const cap = isNewPlayer ? 0.35 : 0.25;
    return Number((cap * Math.min(1, Math.max(0, Number(pv) || 0) / PLANNED_PRE_AUCTION_MATCHDAYS)).toFixed(4));
};
