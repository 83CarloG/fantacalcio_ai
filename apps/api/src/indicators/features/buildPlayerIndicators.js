"use strict";
const getPlayer = require("../../players/jobs/getPlayer");
const calculateAvailabilityScore = require("../jobs/calculateAvailabilityScore");
const calculateBonusPotentialScore = require("../jobs/calculateBonusPotentialScore");
const calculateUpsideScore = require("../jobs/calculateUpsideScore");
const calculateRiskProfile = require("../jobs/calculateRiskProfile");
const calculateConfidenceProfile = require("../jobs/calculateConfidenceProfile");
const calculateDefenseModifierValue = require("../jobs/calculateDefenseModifierValue");
const calculateRelativeValue = require("../jobs/calculateRelativeValue");
const getMarketModel = require("../../market/jobs/getMarketModel");
const predictPrice = require("../../market/jobs/predictPrice");

const MODEL_VERSION = "player-indicators@0.2.0";
const MODEL_SEASON = "2026-27";

function avgClosedRangeWidth(projections) {
    if (!projections) return null;
    const widths = [];
    for (const key of ["appearances", "goals", "assists"]) {
        const range = projections[key];
        if (range && !range.openEnded && range.min != null) widths.push(range.max - range.min);
    }
    return widths.length ? widths.reduce((s, w) => s + w, 0) / widths.length : null;
}

function confidenceLabel(score) {
    if (score >= 70) return "high";
    if (score >= 45) return "medium";
    return "low";
}

/**
 * Assemble one player's full Indicator Model v2 bundle from a pre-built role context
 * (features/buildRoleContext.js — the calling SERVICE builds it once per role and passes it
 * in; a feature may not call another feature). Returns null when the player has no FPEDIA
 * snapshot yet — "no data" is a state the UI renders, never a bundle of invented neutrals.
 *
 * Contract is additive over v1: the keys the BFF already reads
 * (technical.technicalProjectionScore / riskScore / scarcityIndex, market.*, top-level
 * confidence string, warnings[]) keep their meaning; everything else is new. Raw source
 * values (algorithmScoreRaw) are always preserved next to their normalized reading.
 *
 * @param {{playerId:number, roleContext:object}} input
 */
module.exports = async function buildPlayerIndicators({playerId, roleContext}) {
    const player = await getPlayer(playerId);
    if (!player) return null;
    const entry = roleContext.entries.get(Number(playerId));
    if (!entry) return null;

    const {data, usability, ensemble, mids, historical} = entry;
    const skills = data.skills || [];

    const availabilityScore = calculateAvailabilityScore({appearancesMid: mids.appearancesMid, skills});
    const bonusPotentialScore = calculateBonusPotentialScore({productionPercentile: entry.productionPercentile, skills});
    const upsideScore = calculateUpsideScore({skills, projections: data.projections});
    const risk = calculateRiskProfile({
        injured: Boolean(data.flags && data.flags.injured),
        injuryResistancePct: data.injuryResistancePct ?? null,
        skills,
        appearancesMid: mids.appearancesMid,
        hasHistory: historical.hasHistory,
        maxAppearances: historical.maxAppearances
    });
    const confidence = calculateConfidenceProfile({
        ensembleSource: ensemble.source,
        fcpAtFloor: ensemble.fcpAtFloor,
        disagreement: ensemble.disagreement,
        hasHistory: historical.hasHistory,
        maxAppearances: historical.maxAppearances,
        projections: data.projections || null,
        avgClosedRangeWidth: avgClosedRangeWidth(data.projections),
        editorialFcpScore: data.editorialFcpScore ?? null,
        algorithmUsable: usability.usable,
        investmentSolidityPct: data.investmentSolidityPct ?? null,
        injuryResistancePct: data.injuryResistancePct ?? null,
        skills
    });
    const defenseModifierValue = calculateDefenseModifierValue({role: player.role, weightedMv: historical.weightedMv});
    const relative = calculateRelativeValue({playerId: Number(playerId), rolePlayers: roleContext.rolePlayers, demand: roleContext.demand});

    // preseason prior + PV-weighted early-season evidence, blended in buildRoleContext.js
    // (the blend must live there: percentiles and rankings need every peer's CURRENT score)
    const technicalScore = entry.currentScore;

    // fvm feeds the market model from the flat listone column — the nested seed-fixture
    // shape the v1 infer() chased never existed in live data (see the 2026-08-10 fix)
    const fvm = player.fvm_classic ?? 0;
    const model = await getMarketModel();
    const market = await predictPrice({role: player.role, fvm, model});

    const reasons = [...ensemble.reasons];
    if (skills.length > 0) reasons.push(`Tags: ${skills.join(", ")}`);
    if (data.projections && data.projections.appearances) {
        reasons.push(`Projected: ${data.projections.appearances.raw} apps, ${data.projections.goals ? data.projections.goals.raw : "?"} goals, ${data.projections.assists ? data.projections.assists.raw : "?"} assists`);
    }
    if (historical.hasHistory) reasons.push(`Weighted historical MV ${historical.weightedMv}`);
    else reasons.push("No usable Serie A fantavoto history");
    if (entry.stats && entry.stats.pv > 0) {
        reasons.push(`Early season: FM ${entry.stats.fm} over ${entry.stats.pv} rated matches (weight ${(entry.earlySeasonWeight * 100).toFixed(0)}%)`);
    }

    const warnings = [...ensemble.warnings];
    warnings.push("Market calibration currently uses one complete auction season only.");
    if (relative.vorp !== null) warnings.push("Scarcity/VORP use demand-based replacement (24/64/64/48), uncalibrated.");
    if (technicalScore === null) warnings.push("Technical score unavailable: no usable technical input for this player.");

    return {
        modelVersion: MODEL_VERSION,
        modelSeason: MODEL_SEASON,
        computedAt: new Date().toISOString(),
        sourceSnapshotIds: [entry.snapshotId],
        technical: {
            technicalProjectionScore: technicalScore,
            preseasonScore: entry.preseasonScore,
            earlySeasonScore: entry.earlySeasonScore,
            earlySeasonWeight: entry.earlySeasonWeight,
            editorialFcpScore: data.editorialFcpScore ?? null,
            algorithmScoreRaw: data.algorithmScore ?? null,
            algorithmScoreStatus: usability.status,
            algorithmScore: usability.usable,
            ensembleScore: ensemble.score,
            ensembleSource: ensemble.source,
            projectionScore: entry.projectionScore,
            historicalScore: entry.historicalScore,
            availabilityScore,
            bonusPotentialScore,
            upsideScore,
            riskScore: risk.riskScore,
            scarcityIndex: relative.scarcityIndex
        },
        uncertainty: {
            riskScore: risk.riskScore,
            injuryRisk: risk.injuryRisk,
            roleRisk: risk.roleRisk,
            adaptationRisk: risk.adaptationRisk,
            disciplinaryRisk: risk.disciplinaryRisk,
            confidenceScore: confidence.confidenceScore,
            dataCompleteness: confidence.dataCompleteness
        },
        leagueSpecific: {
            defenseModifierValue,
            // official source metric, NOT assumed to match our league's scoring exactly —
            // a leagueAdjustedFantasyAverage waits for the G1 semantics verification
            fantacalcioFantasyAverage: entry.stats ? entry.stats.fm : null,
            // FM − MV = observed bonus/malus per rated game: bonus production measured
            // without double-counting FM with goals/assists
            observedBonusPerGame: (entry.stats && entry.stats.pv > 0 && entry.stats.fm != null && entry.stats.mv != null)
                ? Number((entry.stats.fm - entry.stats.mv).toFixed(3)) : null,
            matchesWithVote: entry.stats ? entry.stats.pv : null
        },
        relativeValue: {
            roleRank: relative.roleRank,
            tier: relative.tier,
            replacementScore: relative.replacementScore,
            vorp: relative.vorp,
            alternativesWithinFive: relative.alternativesWithinFive,
            scarcityIndex: relative.scarcityIndex
        },
        market,
        confidence: confidenceLabel(confidence.confidenceScore),
        reasons,
        warnings
    };
};
