"use strict";
const database = require("../../drivers/database");

module.exports = async function removeOwnerTarget(season, playerId) {
    const result = database().prepare("DELETE FROM owner_targets WHERE season = ? AND player_id = ?").run(season, playerId);
    return {removed: result.changes > 0};
};
