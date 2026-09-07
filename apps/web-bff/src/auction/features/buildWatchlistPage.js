"use strict";
const getPlayers = require("../jobs/getPlayers");
const listTargetIds = require("../jobs/listTargetIds");
const getAuctionState = require("../jobs/getAuctionState");

const CURRENT_SEASON = "2026-27";
const ROLE_ORDER = ["P", "D", "C", "A"];
const ROLE_LABEL = {P: "Portiere", D: "Difensore", C: "Centrocampista", A: "Attaccante"};

/**
 * The pre-auction watchlist-builder: every ACTIVE player, searchable, with whether it's
 * already on the owner's list — so "la mia lista" can be built in bulk before the auction
 * starts instead of one player at a time from inside a live call (see the plan's D.3).
 * Excludes players already picked this season (nothing to add once they're gone).
 */
module.exports = async function buildWatchlistPage() {
    const [players, targetIds, state] = await Promise.all([getPlayers(), listTargetIds(CURRENT_SEASON), getAuctionState(CURRENT_SEASON)]);
    const targetIdSet = new Set(targetIds);
    const pickedIdSet = new Set(state.picks.map((pick) => pick.playerId));
    const rows = players
        .filter((player) => !pickedIdSet.has(player.player_id))
        .map((player) => ({...player, roleLabel: ROLE_LABEL[player.role] || player.role, isTarget: targetIdSet.has(player.player_id)}))
        // real call order (P→D→C→A), not alphabetical — same order the auction itself uses
        .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name));
    return {season: CURRENT_SEASON, players: rows, targetCount: targetIdSet.size};
};
