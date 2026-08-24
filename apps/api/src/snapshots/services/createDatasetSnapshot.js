"use strict";
const createDatasetSnapshotHeader = require("../jobs/createDatasetSnapshotHeader");
const pinPlayerSnapshots = require("../features/pinPlayerSnapshots");

const ALGORITHM_VERSION = "player-indicators@0.2.0"; // keep in sync with indicators/features/buildPlayerIndicators.js

/**
 * Create an immutable dataset snapshot: a header row plus one frozen PLAYER snapshot per
 * ACTIVE player. Does NOT recalculate indicators itself (a service may not call another
 * service — see indicators/services/recalculateIndicators.js) — the caller (route/CLI) runs
 * `recalculateIndicators.all(datasetSnapshotId)` right after this resolves, so the pinned
 * INDICATOR snapshots line up with the same dataset id.
 *
 * @param {{type:'POST_MARKET_BASELINE'|'AUCTION_SNAPSHOT'|'MANUAL', label?:string,
 *   matchdaysIncluded?:number, notes?:string}} input
 * @return {{datasetSnapshotId:number, label:string, playersPinned:number}}
 */
module.exports = async function createDatasetSnapshot({type, label, matchdaysIncluded = 0, notes = null}) {
    const resolvedLabel = label || `${type}_${new Date().toISOString().slice(0, 10)}`;
    const datasetSnapshotId = await createDatasetSnapshotHeader({
        label: resolvedLabel, snapshotType: type, algorithmVersion: ALGORITHM_VERSION, matchdaysIncluded, notes
    });
    const playersPinned = await pinPlayerSnapshots({datasetSnapshotId, snapshotType: type});
    return {datasetSnapshotId, label: resolvedLabel, playersPinned};
};
