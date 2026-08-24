"use strict";

/**
 * Usability semantics for FPEDIA's "Algoritmo Fantacalciopedia" (ALG) raw value.
 *
 * ALG=0 is a "not computed yet" sentinel, NOT a real score. Deterministic evidence from the
 * live audit of 2026-08-10 (all 8 ALG=0 players out of 435): every one is a freshly-created
 * FPEDIA page (consecutive fpediaIds 4149-4157 — new arrivals), has zero Serie A fantavoto
 * history, has a valid FCP score, and the minimum legitimate ALG observed across the whole
 * dataset is 26 — nowhere near 0. Treating raw 0 as a real technical score is what used to
 * collapse those players' technicalScore to 0 and wreck their recommended bid.
 *
 * The raw value is NEVER destroyed — this job only interprets it:
 *   raw = 0            → {status: "not_available", usable: null}   (sentinel)
 *   raw ≥ 1            → {status: "available",     usable: raw}
 *   raw null/undefined → {status: "unknown",       usable: null}   (field absent from snapshot)
 *
 * @param {?number} algorithmScoreRaw
 * @return {{status: 'available'|'not_available'|'unknown', usable: ?number}}
 */
module.exports = function assessAlgorithmScoreUsability(algorithmScoreRaw) {
    if (algorithmScoreRaw === null || algorithmScoreRaw === undefined) return {status: "unknown", usable: null};
    if (algorithmScoreRaw === 0) return {status: "not_available", usable: null};
    return {status: "available", usable: algorithmScoreRaw};
};
