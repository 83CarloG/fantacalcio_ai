"use strict";
const listTargetIds = require("../jobs/listTargetIds");
const addTarget = require("../jobs/addTarget");
const removeTarget = require("../jobs/removeTarget");

/**
 * Single toggle used by every "add/remove from my list" affordance (the call screen's
 * quick-actions and the watchlist-builder's per-row quick-actions alike) — one JSON
 * round-trip, no full-page redirect, so a bulk pre-auction watchlist session doesn't
 * reload the page per player.
 */
module.exports = async function toggleTarget(season, playerId) {
    const targetIds = await listTargetIds(season);
    const isTarget = targetIds.includes(Number(playerId));
    if (isTarget) await removeTarget(season, playerId);
    else await addTarget(season, playerId);
    return {isTarget: !isTarget};
};
