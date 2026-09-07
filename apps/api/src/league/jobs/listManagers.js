"use strict";
const database = require("../../drivers/database");

/** Every manager registered for a season, ordered by their fixed calling order. */
module.exports = async function listManagers(season) {
    const rows = database().prepare(`
        SELECT id, season, name, budget_total AS budgetTotal, is_owner AS isOwnerRaw, call_order AS callOrder, created_at AS createdAt
        FROM managers WHERE season = ? ORDER BY call_order ASC, id ASC
    `).all(season);
    return rows.map((row) => ({...row, isOwner: Boolean(row.isOwnerRaw), isOwnerRaw: undefined}));
};
