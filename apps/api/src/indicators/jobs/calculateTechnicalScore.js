"use strict";
module.exports = async function calculateTechnicalScore({preseasonScore, earlySeasonScore, earlySeasonWeight}) {
    const prior = Number(preseasonScore ?? 50);
    const current = Number(earlySeasonScore ?? prior);
    const weight = Math.max(0, Math.min(0.35, Number(earlySeasonWeight || 0)));
    return Number((prior * (1 - weight) + current * weight).toFixed(2));
};
