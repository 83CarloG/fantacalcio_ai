"use strict";
const database = require("../../drivers/database");

/**
 * Create or replace this season's configurable league parameters — the whole point is that
 * next season's operator edits these instead of touching code (see shared/leagueRules.js,
 * which stays the static default the indicators pipeline reads; this table is read only by
 * the auction/league side: manager budget default, roster-slot targets shown in the UI, the
 * nomination-suggestion engine).
 *
 * @param {{season:string, participants:number, budgetPerManager:number, rosterSlots:{P:number,D:number,C:number,A:number}}} input
 */
module.exports = async function upsertSeasonRules({season, participants, budgetPerManager, rosterSlots}) {
    const now = new Date().toISOString();
    database().prepare(`
        INSERT INTO season_rules(season, participants, budget_per_manager, roster_slots_json, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(season) DO UPDATE SET
            participants = excluded.participants,
            budget_per_manager = excluded.budget_per_manager,
            roster_slots_json = excluded.roster_slots_json
    `).run(season, participants, budgetPerManager, JSON.stringify(rosterSlots), now);
    return {season, participants, budgetPerManager, rosterSlots};
};
