"use strict";

/**
 * Positive-tail potential, 0-100 — deliberately null when NO upside signal exists (an
 * established known quantity has low upside, but "no signal" is different from "measured
 * low"). Signals and their explicit UNCALIBRATED weights: Giovane talento +20, Outsider +15,
 * open-ended appearance projection +10, wide (≥5) goal/assist ranges +5 each — wide ranges
 * mean the editors themselves see a fat tail. Base 40 when at least one signal fires.
 *
 * @param {{skills:Array<string>, projections:?object}} input
 * @return {?number}
 */
module.exports = function calculateUpsideScore({skills = [], projections}) {
    let bonus = 0;
    if (skills.includes("Giovane talento")) bonus += 20;
    if (skills.includes("Outsider")) bonus += 15;
    if (projections && projections.appearances && projections.appearances.openEnded) bonus += 10;
    for (const key of ["goals", "assists"]) {
        const range = projections && projections[key];
        if (range && !range.openEnded && range.min != null && range.max - range.min >= 5) bonus += 5;
    }
    if (bonus === 0) return null;
    return Math.min(100, 40 + bonus);
};
