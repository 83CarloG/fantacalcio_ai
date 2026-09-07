"use strict";
const database = require("../../drivers/database");

/** Bare set of player ids the owner has marked as nomination targets this season. */
module.exports = async function listOwnerTargetIds(season) {
    return database().prepare("SELECT player_id AS playerId FROM owner_targets WHERE season = ?").all(season).map((row) => row.playerId);
};
