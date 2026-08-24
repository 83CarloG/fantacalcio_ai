"use strict";

/**
 * How likely the player is to actually play, 0-100. Primary signal: projected appearances
 * (midpoint, or min for open-ended ranges) over a 38-game season; small explicit
 * UNCALIBRATED adjustments from the Titolare/Panchinaro editorial tags (which never
 * co-occur — verified in the 2026-08-10 data-quality report). With no projection at all,
 * the tags alone give a coarse fallback; with neither → null, never an invented neutral.
 *
 * @param {{appearancesMid:?number, skills:Array<string>}} input
 * @return {?number}
 */
module.exports = function calculateAvailabilityScore({appearancesMid, skills = []}) {
    const titolare = skills.includes("Titolare");
    const panchinaro = skills.includes("Panchinaro");

    if (appearancesMid == null) {
        if (titolare) return 70;
        if (panchinaro) return 35;
        return null;
    }
    let score = Math.min(100, (appearancesMid / 38) * 100);
    if (titolare) score += 8;
    if (panchinaro) score -= 12;
    return Number(Math.max(0, Math.min(100, score)).toFixed(2));
};
