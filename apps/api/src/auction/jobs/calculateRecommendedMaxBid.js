"use strict";
module.exports = async function calculateRecommendedMaxBid({expectedPrice, technicalProjectionScore, scarcityIndex, riskScore, availableBudget, minimumReserve}) {
    const qualityAdjustment = (Number(technicalProjectionScore || 50) - 50) * 0.12;
    const scarcityAdjustment = Number(scarcityIndex || 0) * 0.06;
    const riskAdjustment = Number(riskScore || 0) * 0.08;
    const raw = Number(expectedPrice || 1) + qualityAdjustment + scarcityAdjustment - riskAdjustment;
    const affordable = Math.max(0, Number(availableBudget || 0) - Number(minimumReserve || 0));
    return Math.max(1, Math.min(Math.round(raw), affordable));
};
