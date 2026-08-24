"use strict";
const listActivePlayerIds = require("../../players/jobs/listActivePlayerIds");
const getPlayer = require("../../players/jobs/getPlayer");
const getLatestSnapshot = require("../../players/jobs/getLatestSnapshot");
const recordPlayerSnapshot = require("../../sources/jobs/recordPlayerSnapshot");

/**
 * Freeze a PLAYER snapshot for every ACTIVE player into a dataset snapshot: the player's
 * current row (identity, role, quotations/FVM) merged with whatever FPEDIA-sourced data was
 * last known for it, so this one row is self-contained — reconstructing the dataset later
 * never depends on correlating it back against other tables that keep changing.
 *
 * @param {{datasetSnapshotId:number, snapshotType:string}} input
 * @return {number} how many players were pinned
 */
module.exports = async function pinPlayerSnapshots({datasetSnapshotId, snapshotType}) {
    const playerIds = await listActivePlayerIds();
    for (const playerId of playerIds) {
        const player = await getPlayer(playerId);
        const fpediaSnapshot = await getLatestSnapshot(playerId, {excludeTypes: ["LISTONE_IMPORT", "MATCHDAY"]});
        await recordPlayerSnapshot({
            playerId,
            snapshotType,
            datasetSnapshotId,
            payload: {player, sources: (fpediaSnapshot && fpediaSnapshot.sources) || null}
        });
    }
    return playerIds.length;
};
