"use strict";
const getCurrentCaller = require("../jobs/getCurrentCaller");
const setCurrentCaller = require("../jobs/setCurrentCaller");
const listAuctionPicks = require("../jobs/listAuctionPicks");
const listManagers = require("../../league/jobs/listManagers");
const getSeasonRules = require("../../league/jobs/getSeasonRules");
const leagueRules = require("../../shared/leagueRules");

/**
 * Move the call-turn pointer to the next manager by fixed `call_order` (cyclic), skipping
 * any manager whose roster is already full — the calling order is set once at the start of
 * the auction and stays fixed for its whole duration, except that a manager who no longer
 * needs to buy is skipped (per the user's own rule for this league). Called with no current
 * caller (auction just starting) picks the lowest `call_order`. If every manager is
 * exhausted, the pointer is cleared to null — the auction is effectively over.
 *
 * @param {string} season
 */
module.exports = async function advanceAuctionTurn(season) {
    const [currentCallerId, managers, picks, seasonRules] = await Promise.all([
        getCurrentCaller(season), listManagers(season), listAuctionPicks(season), getSeasonRules(season)
    ]);
    if (managers.length === 0) return {currentCallerManagerId: null};

    const slotsTarget = seasonRules ? seasonRules.rosterSlots : leagueRules.rosterSlots;
    const totalSlotsTarget = Object.values(slotsTarget).reduce((sum, count) => sum + count, 0);

    function isExhausted(managerId) {
        const pickCount = picks.filter((pick) => pick.managerId === managerId).length;
        return pickCount >= totalSlotsTarget;
    }

    const ordered = [...managers].sort((a, b) => a.callOrder - b.callOrder);
    const currentIndex = currentCallerId ? ordered.findIndex((manager) => manager.id === currentCallerId) : -1;

    for (let step = 1; step <= ordered.length; step++) {
        const candidate = ordered[(currentIndex + step) % ordered.length];
        if (!isExhausted(candidate.id)) {
            await setCurrentCaller(season, candidate.id);
            return {currentCallerManagerId: candidate.id};
        }
    }
    await setCurrentCaller(season, null); // every manager exhausted
    return {currentCallerManagerId: null};
};
