"use strict";
const getAuctionState = require("../jobs/getAuctionState");
const getPlayerIndicators = require("../jobs/getPlayerIndicators");
const evaluateBidJob = require("../jobs/evaluateBid");

const CURRENT_SEASON = "2026-27";

/**
 * Bid/pass guidance for the whistle-mode live-call screen, recomputed on every price change.
 * Reads the owner's real remaining budget/slots from `buildAuctionState` (API) so the
 * recommendation reflects what's actually left to spend, not a value the operator has to
 * type in by hand each time (unlike the removed one-off player-page evaluate form).
 *
 * @param {{playerId:string|number, currentBid:number}} input
 */
module.exports = async function evaluateLiveBid({playerId, currentBid}) {
    const [state, indicators] = await Promise.all([getAuctionState(CURRENT_SEASON), getPlayerIndicators(playerId)]);
    const owner = state.owner;
    if (!owner) return {error: "no_owner_set"};
    if (!indicators) return {error: "no_indicators"};

    const totalSlotsTarget = Object.values(owner.slotsTarget).reduce((sum, count) => sum + count, 0);
    const totalSlotsFilled = Object.values(owner.slotsByRole).reduce((sum, count) => sum + count, 0);
    const remainingSlots = Math.max(0, totalSlotsTarget - totalSlotsFilled);

    const evaluation = await evaluateBidJob({
        remainingSlots,
        minimumPlayerPrice: 1,
        availableBudget: owner.remaining,
        currentBid,
        expectedPrice: indicators.market.expectedPrice,
        technicalProjectionScore: indicators.technical.technicalProjectionScore,
        scarcityIndex: indicators.technical.scarcityIndex,
        riskScore: indicators.technical.riskScore
    });
    return {evaluation};
};
