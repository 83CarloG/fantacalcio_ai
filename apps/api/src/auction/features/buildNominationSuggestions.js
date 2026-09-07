"use strict";
const listOwnerTargetIds = require("../jobs/listOwnerTargetIds");
const listAuctionPicks = require("../jobs/listAuctionPicks");
const listLatestIndicatorsForPlayers = require("../../indicators/jobs/listLatestIndicatorsForPlayers");
const listManagers = require("../../league/jobs/listManagers");
const getSeasonRules = require("../../league/jobs/getSeasonRules");
const leagueRules = require("../../shared/leagueRules");

const ROLE_ORDER = ["P", "D", "C", "A"];
// a player counts as "good" for scarcity/decoy purposes at tier <= 3 (out of the up-to-6
// tiers calculateRelativeValue.js's cliff detection produces) — UNCALIBRATED, same spirit
// as every other threshold in this codebase's v2 indicator model.
const GOOD_TIER_THRESHOLD = 3;
const DECOY_LIMIT = 8;

/**
 * The "Cosa chiamo?" nomination-suggestion lists, grounded in real auction-draft theory
 * (see the design note in the session's plan — Value-Based Drafting/tiers, decoy
 * nominations to drain opponents' budgets, few-pillars-rest-cheap): who's on the owner's
 * watchlist and still available, good-but-unwatched players to nominate as decoys, and how
 * many good options remain per role. Deliberately does NOT try to time nominations against
 * opponents' live budget/slots (a real refinement, left for later — see the plan) to keep
 * this correct and shippable now rather than sophisticated and unverified.
 *
 * A real call-based auction (this league included — see league-profile.json's
 * roleOrderStartsWith) proceeds in role PHASES: every P first, then every D, etc. `targets`
 * and `decoys` are therefore grouped by role in that same order, and `currentPhase` is
 * derived from real pick counts vs this season's real total role demand (participants ×
 * roster slots) — the first role that hasn't yet reached its full demand — never an
 * arbitrary threshold.
 *
 * @param {string} season
 * @param {Array<{player_id:number, name:string, team:string, role:string}>} players every ACTIVE player (role/team/name), from the players module
 */
module.exports = async function buildNominationSuggestions(season, players) {
    const [targetIds, picks, allIndicators, managers, seasonRules] = await Promise.all([
        listOwnerTargetIds(season), listAuctionPicks(season), listLatestIndicatorsForPlayers(),
        listManagers(season), getSeasonRules(season)
    ]);
    const targetIdSet = new Set(targetIds);
    const pickedIdSet = new Set(picks.map((pick) => pick.playerId));
    const indicatorsByPlayer = new Map(allIndicators.map((entry) => [entry.playerId, entry]));

    const available = players
        .filter((player) => !pickedIdSet.has(player.player_id))
        .map((player) => ({...player, indicators: indicatorsByPlayer.get(player.player_id) || null}))
        .filter((player) => player.indicators && player.indicators.vorp !== null);

    const slotsTarget = seasonRules ? seasonRules.rosterSlots : leagueRules.rosterSlots;
    const totalDemandByRole = {};
    for (const role of ROLE_ORDER) totalDemandByRole[role] = slotsTarget[role] * managers.length;
    const pickedCountByRole = {};
    for (const role of ROLE_ORDER) pickedCountByRole[role] = picks.filter((pick) => pick.playerRole === role).length;
    // the first role whose real demand (participants × slots) hasn't been fully picked yet —
    // null once every role is exhausted (draft complete). Zero managers registered means zero
    // demand everywhere, so it correctly falls through to null rather than dividing by nothing.
    const currentPhase = ROLE_ORDER.find((role) => pickedCountByRole[role] < totalDemandByRole[role]) || null;

    // per-role cap (not a global one): a flat global top-N would be dominated by attackers'
    // naturally higher VORP and starve the P/D decoy lists during those phases of the draft.
    function groupByRole(list, limitPerRole) {
        return ROLE_ORDER
            .map((role) => ({
                role,
                isCurrentPhase: role === currentPhase,
                players: list.filter((player) => player.role === role).slice(0, limitPerRole || Infinity)
            }))
            .filter((group) => group.players.length > 0);
    }

    const targets = available
        .filter((player) => targetIdSet.has(player.player_id))
        .sort((a, b) => b.indicators.vorp - a.indicators.vorp);

    const decoys = available
        .filter((player) => !targetIdSet.has(player.player_id) && player.indicators.tier !== null && player.indicators.tier <= GOOD_TIER_THRESHOLD && player.indicators.vorp > 0)
        .sort((a, b) => b.indicators.vorp - a.indicators.vorp);

    const scarcityByRole = ROLE_ORDER.map((role) => ({
        role,
        isCurrentPhase: role === currentPhase,
        goodAvailable: available.filter((player) => player.role === role && player.indicators.tier !== null && player.indicators.tier <= GOOD_TIER_THRESHOLD).length
    }));

    return {currentPhase, targetsByRole: groupByRole(targets), decoysByRole: groupByRole(decoys, DECOY_LIMIT), scarcityByRole};
};
