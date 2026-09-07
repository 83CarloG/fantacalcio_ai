"use strict";
const buildRoleContext = require("../features/buildRoleContext");
const buildPlayerIndicators = require("../features/buildPlayerIndicators");
const recordIndicatorSnapshot = require("../jobs/recordIndicatorSnapshot");
const getIndicatorCoverage = require("../jobs/getIndicatorCoverage");
const getIndicatorStaleness = require("../jobs/getIndicatorStaleness");
const getPlayer = require("../../players/jobs/getPlayer");
const listActivePlayerIds = require("../../players/jobs/listActivePlayerIds");

async function persist(playerId, roleContext, datasetSnapshotId) {
    const indicators = await buildPlayerIndicators({playerId, roleContext});
    if (!indicators) return {playerId, recalculated: false};
    await recordIndicatorSnapshot({playerId, algorithmVersion: indicators.modelVersion, payload: indicators, datasetSnapshotId});
    return {playerId, recalculated: true};
}

/** Compute + persist one player's indicators as a new INDICATOR snapshot. */
async function one(playerId, datasetSnapshotId = null) {
    const player = await getPlayer(playerId);
    if (!player) return {playerId, recalculated: false};
    const roleContext = await buildRoleContext(player.role);
    return persist(playerId, roleContext, datasetSnapshotId);
}

/**
 * Recalculate every ACTIVE player. The role context (distributions, per-peer preseason
 * scores, demand-ranked list) is built ONCE per role and reused across that role's players
 * — rebuilding it per player would redo the same ~150-snapshot scan ~150 times per role.
 * Used both as the manual admin "Ricalcola indicatori" trigger and automatically after
 * events that change indicator inputs; those callers sequence this at the route/CLI level,
 * since Luminous forbids same-layer (service -> service) calls.
 */
async function all(datasetSnapshotId = null) {
    const playerIds = await listActivePlayerIds();
    const contextByRole = new Map();
    const results = [];
    for (const playerId of playerIds) {
        const player = await getPlayer(playerId);
        if (!player) { results.push({playerId, recalculated: false}); continue; }
        if (!contextByRole.has(player.role)) contextByRole.set(player.role, await buildRoleContext(player.role));
        results.push(await persist(playerId, contextByRole.get(player.role), datasetSnapshotId));
    }
    return {total: results.length, recalculated: results.filter((result) => result.recalculated).length};
}

/** How much of the ACTIVE roster already has a persisted indicator snapshot, for the setup/admin status view. */
async function coverage() {
    return getIndicatorCoverage();
}

/** Age distribution of the ACTIVE roster's most recent indicator snapshot, for the data-health page. */
async function staleness() {
    return getIndicatorStaleness();
}

module.exports = {one, all, coverage, staleness};
