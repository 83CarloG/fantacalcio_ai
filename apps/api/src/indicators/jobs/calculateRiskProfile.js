"use strict";

// aggregate weights — explicit and UNCALIBRATED (documented at the checkpoint): injury and
// role security dominate, adaptation matters for newcomers, discipline is a minor factor
const WEIGHTS = {injury: 0.35, role: 0.35, adaptation: 0.20, discipline: 0.10};

/**
 * Risk answers "how risky is this player?" — kept strictly separate from confidence
 * ("how much do we trust our own estimate?", see calculateConfidenceProfile.js). The two
 * are independent by construction: a player can be high-risk/high-confidence (we KNOW he's
 * fragile) or low-risk/low-confidence (looks safe, little evidence).
 *
 * Components (each 0-100):
 * - injuryRisk: injured flag + injury resistance (a 5-level ordinal ×20 from the source)
 * - roleRisk: Panchinaro/Titolare tags + projected appearances
 * - adaptationRisk: no usable Serie A fantavoto history → high (newcomer adaptation)
 * - disciplinaryRisk: Falloso tag (yellow/red exposure, -0.5/-1 in our league)
 *
 * @return {{injuryRisk:number, roleRisk:number, adaptationRisk:number,
 *   disciplinaryRisk:number, riskScore:number}}
 */
module.exports = function calculateRiskProfile({injured = false, injuryResistancePct = null, skills = [], appearancesMid = null, hasHistory = false, maxAppearances = 0}) {
    const injuryRisk = Math.min(100,
        (injured ? 50 : 0) + (injuryResistancePct == null ? 15 : (100 - injuryResistancePct) * 0.35));

    let roleRisk = skills.includes("Panchinaro") ? 60 : (skills.includes("Titolare") ? 15 : 35);
    if (appearancesMid == null) roleRisk += 10;
    else if (appearancesMid < 15) roleRisk += 20;
    else if (appearancesMid < 25) roleRisk += 10;
    roleRisk = Math.min(100, roleRisk);

    const adaptationRisk = !hasHistory ? 70 : (maxAppearances < 10 ? 40 : 15);
    const disciplinaryRisk = skills.includes("Falloso") ? 60 : 20;

    const riskScore = Number((
        injuryRisk * WEIGHTS.injury + roleRisk * WEIGHTS.role +
        adaptationRisk * WEIGHTS.adaptation + disciplinaryRisk * WEIGHTS.discipline
    ).toFixed(2));

    return {
        injuryRisk: Number(injuryRisk.toFixed(2)),
        roleRisk,
        adaptationRisk,
        disciplinaryRisk,
        riskScore
    };
};
