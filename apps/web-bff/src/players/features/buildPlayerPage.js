"use strict";
const getPlayer = require("../jobs/getPlayer");
const getIndicators = require("../jobs/getIndicators");
const evaluateBid = require("../jobs/evaluateBid");

/**
 * Compose the player detail page view model. When `bidInput` (currentBid/availableBudget/
 * remainingSlots) is supplied, also asks the API for an auction-bid recommendation, reusing
 * the indicators already fetched for this page rather than asking the caller to repeat them.
 *
 * @param {string|number} id
 * @param {{currentBid:number, availableBudget:number, remainingSlots:number}} [bidInput]
 */
module.exports = async function buildPlayerPage(id, bidInput) {
    const player = await getPlayer(id);

    // A player with no FPEDIA-flavored snapshot yet (e.g. resolved only via the Fantacalcio.it
    // detail-page fallback during identity reconciliation) has no indicators to compute — the
    // API 404s (see indicators/features/buildPlayerIndicators.js). That is an expected state,
    // not a page-breaking error: render the page with indicators = null instead of crashing.
    let indicators = null;
    try {
        indicators = await getIndicators(id);
    } catch (_error) {
        indicators = null;
    }

    let evaluation = null;
    let evaluationError = null;
    if (bidInput && indicators) {
        try {
            evaluation = await evaluateBid({
                playerId: id,
                currentBid: bidInput.currentBid,
                availableBudget: bidInput.availableBudget,
                remainingSlots: bidInput.remainingSlots,
                expectedPrice: indicators.market.expectedPrice,
                technicalProjectionScore: indicators.technical.technicalProjectionScore,
                scarcityIndex: indicators.technical.scarcityIndex,
                riskScore: indicators.technical.riskScore
            });
        } catch (error) {
            // a bad/edge-case input should re-render the page with a clear message, not crash it
            evaluationError = error.message;
        }
    }

    return {title: player.name, player, indicators, bidInput, evaluation, evaluationError};
};
