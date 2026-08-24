"use strict";

/**
 * The real rules of OUR league (Classic mode), used by the v2 indicators so player value
 * reflects this ruleset, not a generic fantacalcio. Pure data (Luminous /shared).
 *
 * rosterDemand = participants × slots per role: with 8 managers the market genuinely absorbs
 * 24 P / 64 D / 64 C / 48 A — the demand-based replacement level for VORP (approved: strict
 * Nth player, no buffer).
 *
 * defenseModifierThresholds: the modifier applies only when fielding ≥4 defenders; the
 * user's habitual formation is 3-4-3, so `defenseModifierValue` is informational only and
 * carries zero weight in any aggregate (see indicators/jobs/calculateDefenseModifierValue.js).
 *
 * Captain bonus/malus are 0/0 in this league → intentionally absent from this file.
 */
module.exports = {
    participants: 8,
    budgetPerManager: 500,
    rosterSlots: {P: 3, D: 8, C: 8, A: 6},
    rosterDemand: {P: 24, D: 64, C: 64, A: 48},
    // league scoring for offensive production (goal +3, assist +1) — used to weight
    // projected goals vs assists into one production number
    goalPoints: 3,
    assistPoints: 1,
    defenseModifierThresholds: [
        {minAverage: 7, value: 2.5},
        {minAverage: 6.75, value: 2},
        {minAverage: 6.5, value: 1.5},
        {minAverage: 6.25, value: 1},
        {minAverage: 6, value: 0.5}
    ]
};
