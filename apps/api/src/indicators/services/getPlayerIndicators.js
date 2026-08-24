"use strict";
const getPlayer = require("../../players/jobs/getPlayer");
const buildRoleContext = require("../features/buildRoleContext");
const buildPlayerIndicators = require("../features/buildPlayerIndicators");

/** One player's v2 indicator bundle: build the role context, then assemble the bundle. */
module.exports = async function getPlayerIndicators(payload) {
    const player = await getPlayer(payload.playerId);
    if (!player) return null;
    const roleContext = await buildRoleContext(player.role);
    return buildPlayerIndicators({playerId: payload.playerId, roleContext});
};
