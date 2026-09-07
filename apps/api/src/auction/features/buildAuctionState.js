"use strict";
const listManagers = require("../../league/jobs/listManagers");
const listAuctionPicks = require("../jobs/listAuctionPicks");
const getCurrentCaller = require("../jobs/getCurrentCaller");
const getSeasonRules = require("../../league/jobs/getSeasonRules");
const leagueRules = require("../../shared/leagueRules");

/**
 * The live-auction page's whole view: every manager with budget spent/remaining and roster
 * slots filled by role (derived from `live_auction_picks`, never stored redundantly), the
 * full pick ledger, and whose turn it is to call next. `slotsTarget` comes from this
 * season's configurable rules (`season_rules`) when set up, falling back to the static
 * `leagueRules.js` defaults otherwise — see db/006_league_config_and_turn.sql's header
 * comment for why only this side reads the configurable table.
 *
 * @param {string} season
 */
module.exports = async function buildAuctionState(season) {
    const [managers, picks, currentCallerManagerId, seasonRules] = await Promise.all([
        listManagers(season), listAuctionPicks(season), getCurrentCaller(season), getSeasonRules(season)
    ]);
    const slotsTarget = seasonRules ? seasonRules.rosterSlots : leagueRules.rosterSlots;

    const managersWithSpend = managers.map((manager) => {
        const managerPicks = picks.filter((pick) => pick.managerId === manager.id);
        const spent = managerPicks.reduce((sum, pick) => sum + pick.price, 0);
        const slotsByRole = {P: 0, D: 0, C: 0, A: 0};
        for (const pick of managerPicks) {
            if (slotsByRole[pick.playerRole] !== undefined) slotsByRole[pick.playerRole] += 1;
        }
        return {...manager, spent, remaining: manager.budgetTotal - spent, slotsByRole, slotsTarget};
    });

    const currentCaller = currentCallerManagerId ? managersWithSpend.find((manager) => manager.id === currentCallerManagerId) || null : null;
    const owner = managersWithSpend.find((manager) => manager.isOwner) || null;

    return {managers: managersWithSpend, picks, currentCaller, owner, budgetPerManagerDefault: seasonRules ? seasonRules.budgetPerManager : leagueRules.budgetPerManager};
};
