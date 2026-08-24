"use strict";
const calculateMinimumReserve = require("../jobs/calculateMinimumReserve");
const calculateRecommendedMaxBid = require("../jobs/calculateRecommendedMaxBid");
module.exports = async function evaluateBid(input) {
    const minimumReserve = await calculateMinimumReserve({remainingSlots: input.remainingSlots, minimumPlayerPrice: input.minimumPlayerPrice || 1});
    const recommendedMaxBid = await calculateRecommendedMaxBid({...input, minimumReserve});
    return {minimumReserve, recommendedMaxBid, affordableBudget: Math.max(0, Number(input.availableBudget || 0) - minimumReserve), strategy: Number(input.currentBid || 0) <= recommendedMaxBid ? "bid" : "pass"};
};
