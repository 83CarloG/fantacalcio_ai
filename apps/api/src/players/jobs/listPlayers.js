"use strict";
const database = require("../../drivers/database");
module.exports = async function listPlayers(filters = {}) {
    const db = database();
    const role = filters.role || null;
    const columns = "player_id, name, full_name, team, role, quotation_classic, fvm_classic";
    // REMOVED players (dropped from a later listone import, see jobs/markPlayersRemoved.js)
    // are kept in the table for history/FKs but excluded from the eligible browse listing.
    const rows = role
        ? db.prepare(`SELECT ${columns} FROM players WHERE status = 'ACTIVE' AND role = ? ORDER BY name`).all(role)
        : db.prepare(`SELECT ${columns} FROM players WHERE status = 'ACTIVE' ORDER BY name`).all();
    return rows;
};
