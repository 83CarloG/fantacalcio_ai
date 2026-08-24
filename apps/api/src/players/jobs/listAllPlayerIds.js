"use strict";
const database = require("../../drivers/database");

/** Every player id in the table, ANY status — for joining external rows that may reference removed players. */
module.exports = async function listAllPlayerIds() {
    return database().prepare("SELECT player_id FROM players").all().map((row) => row.player_id);
};
