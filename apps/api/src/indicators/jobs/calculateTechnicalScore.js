"use strict";
// mirrors the blend already used in features/buildRoleContext.js:78-84 — kept here as the
// unit-testable standalone version. A missing prior/early-season score must never be
// invented (was `?? 50` here previously: a real bug, caught in review, this file was
// unreachable from production code so it never actually corrupted a live score — fixed
// before anything wires it in).
module.exports = async function calculateTechnicalScore({preseasonScore, earlySeasonScore, earlySeasonWeight}) {
    if (preseasonScore === null || preseasonScore === undefined) return earlySeasonScore ?? null;
    if (earlySeasonScore === null || earlySeasonScore === undefined) return preseasonScore;
    const weight = Math.max(0, Math.min(0.35, Number(earlySeasonWeight || 0)));
    return Number((preseasonScore * (1 - weight) + earlySeasonScore * weight).toFixed(2));
};
