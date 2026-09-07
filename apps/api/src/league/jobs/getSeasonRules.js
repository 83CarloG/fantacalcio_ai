"use strict";
const database = require("../../drivers/database");

/** This season's configurable league parameters, or null if never set up (caller falls back to the static defaults). */
module.exports = async function getSeasonRules(season) {
    const row = database().prepare(`
        SELECT season, participants, budget_per_manager AS budgetPerManager, roster_slots_json AS rosterSlotsJson, created_at AS createdAt
        FROM season_rules WHERE season = ?
    `).get(season);
    if (!row) return null;
    return {...row, rosterSlots: JSON.parse(row.rosterSlotsJson)};
};
