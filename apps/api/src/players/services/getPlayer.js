"use strict";
const getPlayerJob = require("../jobs/getPlayer");
const getLatestSnapshotJob = require("../jobs/getLatestSnapshot");
module.exports = async function getPlayer(payload) {
    const player = await getPlayerJob(payload.playerId);
    if (!player) return null;
    const snapshot = await getLatestSnapshotJob(payload.playerId);
    return {...player, snapshot};
};
