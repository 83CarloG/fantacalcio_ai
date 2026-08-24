"use strict";

function midpoint(range) {
    if (!range || range.min == null) return null;
    // open-ended ("30+"): use min as the declared-conservative reading — never invent a max
    return range.openEnded ? range.min : (range.min + range.max) / 2;
}

/**
 * Midpoints of the three FPEDIA projection ranges, for percentile normalization. Closed
 * ranges use (min+max)/2; open-ended ranges use min (conservative, documented); ambiguous
 * ranges (min null) stay null. The range WIDTH information is not lost — it feeds
 * confidence separately (see calculateConfidenceProfile.js).
 *
 * @param {?{appearances:?object, goals:?object, assists:?object}} projections
 */
module.exports = function extractProjectionMidpoints(projections) {
    if (!projections) return {appearancesMid: null, goalsMid: null, assistsMid: null};
    return {
        appearancesMid: midpoint(projections.appearances),
        goalsMid: midpoint(projections.goals),
        assistsMid: midpoint(projections.assists)
    };
};
