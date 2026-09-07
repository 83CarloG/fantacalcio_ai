"use strict";
const database = require("../../drivers/database");

/** Mark exactly one manager as "me" for the season — clears any previous owner first (2 statements, no DB constraint: not worth one for a single-operator flag). */
module.exports = async function setManagerOwner(season, managerId) {
    const db = database();
    db.prepare("UPDATE managers SET is_owner = 0 WHERE season = ?").run(season);
    const result = db.prepare("UPDATE managers SET is_owner = 1 WHERE season = ? AND id = ?").run(season, managerId);
    return {updated: result.changes > 0};
};
