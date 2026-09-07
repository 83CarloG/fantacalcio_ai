"use strict";
const getPlayer = require("../jobs/getPlayer");
const getPlayerIndicators = require("../jobs/getPlayerIndicators");
const getAuctionState = require("../jobs/getAuctionState");
const listTargetIds = require("../jobs/listTargetIds");

const CURRENT_SEASON = "2026-27";

function value(v) {
    return v === null || v === undefined ? null : v;
}

/**
 * The "player currently up for auction" screen: player + a compact indicator readout +
 * everything the whistle-mode live-evaluation needs (the owner's remaining budget/slots) +
 * the manager list for the "someone else won it" closing action. Reuses the exact same
 * indicators payload the player page reads — no new API surface for the numbers themselves.
 *
 * @param {string|number} playerId
 */
module.exports = async function buildAuctionCallPage(playerId) {
    const [player, state, targetIds] = await Promise.all([getPlayer(playerId), getAuctionState(CURRENT_SEASON), listTargetIds(CURRENT_SEASON)]);
    const isTarget = targetIds.includes(Number(playerId));
    let indicators = null;
    try {
        indicators = await getPlayerIndicators(playerId);
    } catch (_error) {
        indicators = null;
    }

    const summary = indicators ? {
        technicalScore: value(indicators.technical.technicalProjectionScore),
        riskScore: value(indicators.technical.riskScore),
        scarcityIndex: value(indicators.technical.scarcityIndex),
        expectedPrice: value(indicators.market.expectedPrice),
        range: indicators.market.range || null,
        vorp: value(indicators.relativeValue.vorp),
        tier: value(indicators.relativeValue.tier),
        confidence: value(indicators.confidence)
    } : null;

    return {
        season: CURRENT_SEASON,
        player,
        indicators,
        summary,
        owner: state.owner,
        managers: state.managers,
        hasOwner: Boolean(state.owner),
        isTarget
    };
};
