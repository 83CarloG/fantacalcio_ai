"use strict";
const getAuctionState = require("../jobs/getAuctionState");

const CURRENT_SEASON = "2026-27";

/**
 * The Live app's "andamento" tab (Task F): minimal read-only recap — who bought what and
 * what everyone has left. No form, no delete/correction — those stay in Preparazione
 * (buildAuctionLivePage.js's fuller manager table). Reuses the exact same `getAuctionState`
 * data, just a leaner shape for a glanceable table.
 */
module.exports = async function buildLiveRecap() {
    const state = await getAuctionState(CURRENT_SEASON);
    const managers = state.managers.map((manager) => ({
        name: manager.name,
        isOwner: manager.isOwner,
        remaining: manager.remaining,
        picks: state.picks
            .filter((pick) => pick.managerId === manager.id)
            .map((pick) => ({playerName: pick.playerName, playerRole: pick.playerRole, price: pick.price}))
    }));
    return {season: CURRENT_SEASON, managers, hasManagers: managers.length > 0};
};
