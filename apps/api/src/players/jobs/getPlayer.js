"use strict";
const database = require("../../drivers/database");
module.exports = async function getPlayer(playerId) {
    return database().prepare("SELECT player_id, name, full_name, status, team, role, quotation_classic, fvm_classic, quotation_mantra, fvm_mantra FROM players WHERE player_id = ?").get(Number(playerId)) || null;
};
