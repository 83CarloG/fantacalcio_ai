"use strict";

/**
 * Confidence answers "how much do we trust our own estimate?" — independent from risk (see
 * calculateRiskProfile.js). Start at 100, subtract explicit UNCALIBRATED penalties for each
 * evidence gap; also reports `dataCompleteness` separately: the purely mechanical fraction
 * of expected inputs that are present, so the UI can answer "which parts of this valuation
 * come from real data vs projections" without conflating it with trust.
 *
 * @return {{confidenceScore:number, dataCompleteness:number, penalties:Array<string>}}
 */
module.exports = function calculateConfidenceProfile({
    ensembleSource, fcpAtFloor = false, disagreement = null,
    hasHistory = false, maxAppearances = 0,
    projections = null, avgClosedRangeWidth = null,
    editorialFcpScore = null, algorithmUsable = null,
    investmentSolidityPct = null, injuryResistancePct = null, skills = []
}) {
    let confidence = 100;
    const penalties = [];
    const apply = (amount, label) => { confidence -= amount; penalties.push(`${label} (-${amount})`); };

    if (ensembleSource === "none") apply(40, "no usable editorial signal");
    else if (ensembleSource !== "ensemble") apply(15, "single editorial signal only");
    if (fcpAtFloor) apply(10, "FCP at floor value");
    if (disagreement !== null && disagreement > 20) apply(15, "editorial signals disagree");
    if (!hasHistory) apply(20, "no usable Serie A history");
    else if (maxAppearances < 10) apply(10, "thin historical sample");
    if (!projections || projections.appearances == null) apply(15, "projections missing");
    // avgClosedRangeWidth is now a RELATIVE width (range/midpoint, see buildPlayerIndicators.js)
    // so this threshold is on a 0-2ish ratio scale, not raw points — 0.5 (range spans half the
    // midpoint) is the UNCALIBRATED cutoff for "wide enough to matter".
    if (avgClosedRangeWidth !== null && avgClosedRangeWidth >= 0.5) apply(10, "wide projection ranges");

    const expectedInputs = [
        editorialFcpScore != null,
        algorithmUsable != null,
        Boolean(projections && projections.appearances),
        Boolean(projections && projections.goals),
        Boolean(projections && projections.assists),
        hasHistory,
        skills.length > 0,
        investmentSolidityPct != null,
        injuryResistancePct != null
    ];
    const dataCompleteness = Number((expectedInputs.filter(Boolean).length / expectedInputs.length * 100).toFixed(2));

    return {confidenceScore: Math.max(5, Math.min(100, confidence)), dataCompleteness, penalties};
};
