"use strict";
const getAuctionState = require("../jobs/getAuctionState");
const getPlayers = require("../jobs/getPlayers");

// hardcoded for now (single private league, one season at a time) — see the open question
// on making season a real selectable dimension in the wizard/tracking design note.
const CURRENT_SEASON = "2026-27";
const ROLE_ORDER = ["P", "D", "C", "A"];
const ROLE_LABEL = {P: "Portieri", D: "Difensori", C: "Centrocampisti", A: "Attaccanti"};

/**
 * The live-auction page's view model: managers with budget/slot summaries, the pick ledger,
 * and the pool of players still available to bid on (the full listone minus anyone already
 * recorded this season), grouped by role for the "record a pick" form's <select>.
 */
module.exports = async function buildAuctionLivePage() {
    const [state, players] = await Promise.all([getAuctionState(CURRENT_SEASON), getPlayers()]);
    const pickedPlayerIds = new Set(state.picks.map((pick) => pick.playerId));
    const available = players.filter((player) => !pickedPlayerIds.has(player.player_id));

    const availableByRole = ROLE_ORDER.map((role) => ({
        role,
        label: ROLE_LABEL[role],
        players: available
            .filter((player) => player.role === role)
            .sort((a, b) => a.name.localeCompare(b.name))
    })).filter((group) => group.players.length > 0);

    return {
        season: CURRENT_SEASON,
        managers: state.managers,
        picks: state.picks,
        availableByRole,
        hasManagers: state.managers.length > 0,
        currentCaller: state.currentCaller,
        owner: state.owner,
        isOwnerTurn: Boolean(state.currentCaller && state.owner && state.currentCaller.id === state.owner.id),
        budgetPerManagerDefault: state.budgetPerManagerDefault
    };
};
