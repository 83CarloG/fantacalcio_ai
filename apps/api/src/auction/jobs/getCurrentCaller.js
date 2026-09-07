"use strict";
const database = require("../../drivers/database");

/** The manager id whose turn it is to call a player, or null if the turn hasn't been set yet (or everyone is exhausted). */
module.exports = async function getCurrentCaller(season) {
    const row = database().prepare("SELECT current_caller_manager_id AS managerId FROM auction_turn WHERE season = ?").get(season);
    return row ? row.managerId : null;
};
