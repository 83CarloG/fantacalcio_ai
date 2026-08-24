"use strict";
const database = require("../../drivers/database");

/** Bare list of ACTIVE player ids, for bulk operations (e.g. full indicator recalculation). */
module.exports = async function listActivePlayerIds() {
    return database().prepare("SELECT player_id FROM players WHERE status = 'ACTIVE'").all().map((row) => row.player_id);
};
