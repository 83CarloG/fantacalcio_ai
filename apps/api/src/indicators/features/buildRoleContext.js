"use strict";
const listRoleFpediaData = require("../../players/jobs/listRoleFpediaData");
const listRoleSeasonStats = require("../../players/jobs/listRoleSeasonStats");
const assessAlgorithmScoreUsability = require("../../sources/jobs/assessAlgorithmScoreUsability");
const calculatePreseasonEnsemble = require("../jobs/calculatePreseasonEnsemble");
const extractProjectionMidpoints = require("../jobs/extractProjectionMidpoints");
const calculateHistoricalMv = require("../jobs/calculateHistoricalMv");
const calculateEarlySeasonWeight = require("../jobs/calculateEarlySeasonWeight");
const percentileRank = require("../../shared/percentileRank");
const leagueRules = require("../../shared/leagueRules");

// preseason technical blend — explicit and UNCALIBRATED (documented at the 2026-08-10
// checkpoint): editorial ensemble dominates, projections and history refine. Missing
// components drop out and the remaining weights renormalize — never replaced by invented
// neutral values.
const TECHNICAL_WEIGHTS = [["ensemble", 0.60], ["projection", 0.25], ["historical", 0.15]];

function blend(components) {
    let weightedSum = 0;
    let weightTotal = 0;
    for (const [key, weight] of TECHNICAL_WEIGHTS) {
        if (components[key] !== null && components[key] !== undefined) {
            weightedSum += components[key] * weight;
            weightTotal += weight;
        }
    }
    return weightTotal === 0 ? null : Number((weightedSum / weightTotal).toFixed(2));
}

/**
 * Everything the v2 indicators need to know about one ROLE, computed once and shared:
 * per-player editorial ensemble / projection midpoints / weighted historical MV, the role
 * distributions those get percentile-ranked against, each player's preseason technical
 * score, and the demand-ranked score list that relative value (rank/replacement/VORP/tiers)
 * reads from. Built once per role by the calling service and passed into
 * buildPlayerIndicators — both for the single-player read and the bulk recalculation, which
 * would otherwise redo this work ~150× per role.
 *
 * @param {string} role
 * @return {{entries: Map<number, object>, rolePlayers: Array<{playerId:number, score:?number}>, demand: number}}
 */
module.exports = async function buildRoleContext(role) {
    const roleData = await listRoleFpediaData(role);
    const seasonStats = await listRoleSeasonStats(role);

    const entries = new Map();
    for (const {playerId, snapshotId, data} of roleData) {
        const usability = assessAlgorithmScoreUsability(data.algorithmScore);
        const ensemble = calculatePreseasonEnsemble({editorialFcpScore: data.editorialFcpScore, algorithmUsable: usability.usable});
        const mids = extractProjectionMidpoints(data.projections);
        const productionMid = (mids.goalsMid == null && mids.assistsMid == null) ? null
            : leagueRules.goalPoints * (mids.goalsMid || 0) + leagueRules.assistPoints * (mids.assistsMid || 0);
        const historical = calculateHistoricalMv(data.history);
        const stats = seasonStats.byPlayerId.get(playerId) || null;
        entries.set(playerId, {playerId, snapshotId, data, usability, ensemble, mids, productionMid, historical, stats});
    }

    const productionMids = [...entries.values()].map((e) => e.productionMid).filter((v) => v != null);
    const weightedMvs = [...entries.values()].map((e) => e.historical.weightedMv).filter((v) => v != null);
    // early-season FM distribution: only players with at least one rated appearance count —
    // a 0-PV player's FM 0.0 is "no data", not a performance
    const observedFms = [...entries.values()]
        .filter((e) => e.stats && e.stats.pv > 0 && e.stats.fm != null)
        .map((e) => e.stats.fm);

    for (const entry of entries.values()) {
        entry.productionPercentile = entry.productionMid != null ? percentileRank(entry.productionMid, productionMids) : null;
        entry.projectionScore = entry.productionPercentile;
        entry.historicalScore = entry.historical.weightedMv != null ? percentileRank(entry.historical.weightedMv, weightedMvs) : null;
        entry.preseasonScore = blend({ensemble: entry.ensemble.score, projection: entry.projectionScore, historical: entry.historicalScore});

        // early-season evidence UPDATES the prior, never replaces it: weight grows with PV
        // (rated appearances) up to the 25%/35% cap; the observed performance is the FM
        // percentile within the role's rated players — same 0-100 scale as the prior
        const pv = entry.stats ? entry.stats.pv || 0 : 0;
        entry.earlySeasonScore = (pv > 0 && entry.stats.fm != null) ? percentileRank(entry.stats.fm, observedFms) : null;
        entry.earlySeasonWeight = await calculateEarlySeasonWeight({pv, isNewPlayer: !entry.historical.hasHistory});
        if (entry.preseasonScore === null) {
            entry.currentScore = entry.earlySeasonScore; // no prior at all: observed evidence stands alone
        } else if (entry.earlySeasonScore === null) {
            entry.currentScore = entry.preseasonScore;
        } else {
            entry.currentScore = Number((entry.preseasonScore * (1 - entry.earlySeasonWeight) + entry.earlySeasonScore * entry.earlySeasonWeight).toFixed(2));
        }
    }

    const rolePlayers = [...entries.values()].map((e) => ({playerId: e.playerId, score: e.currentScore}));
    return {entries, rolePlayers, demand: leagueRules.rosterDemand[role], matchdaysObserved: seasonStats.matchdaysObserved};
};
