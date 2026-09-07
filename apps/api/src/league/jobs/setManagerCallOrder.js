"use strict";
const database = require("../../drivers/database");

/** Reorder one manager's fixed calling-order position (edit before the auction starts — not meant to change mid-auction). */
module.exports = async function setManagerCallOrder(season, managerId, callOrder) {
    const result = database().prepare("UPDATE managers SET call_order = ? WHERE season = ? AND id = ?").run(callOrder, season, managerId);
    return {updated: result.changes > 0};
};
