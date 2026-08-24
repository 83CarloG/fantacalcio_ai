"use strict";

// FCP=30 is FPEDIA's hard floor: 11/435 players sit exactly at 30, none below, then a gap
// to 40 — and the group includes Jonathan David (Juventus's marquee signing, ALG 71), which
// makes 30 implausible as a genuine editorial rating. Verified live on his page 2026-08-10:
// the value is real site data, so it is treated as "likely not yet editorially reviewed",
// not as a usable quality signal.
const FCP_FLOOR = 30;
// |FCP−ALG| beyond this is the top ~8% of observed disagreement (report 2026-08-10:
// median gap 10, p75 13, max 41) — score unaffected, confidence reduced.
const DISAGREEMENT_THRESHOLD = 20;

/**
 * Preseason editorial ensemble, per the approved checkpoint rules (2026-08-10):
 *  1. both usable & FCP not at floor → plain 50/50 mean. The equal weights are NOT arbitrary
 *     here: per-role means of the two signals are near-identical (report: A 69.5 vs 69.6) so
 *     no recentering is needed, correlation is moderate (~0.55 → both informative), and no
 *     outcome data exists yet to prefer one. Explicitly UNCALIBRATED until early-season
 *     validation (rank-correlate each signal against real MV/FM after G1-G4).
 *  2. FCP at floor → ALG only, reduced confidence.
 *  3. ALG not usable (raw 0 sentinel / absent) → FCP only, reduced confidence.
 *  4. disagreement > threshold → mean unchanged, confidence reduced + warning.
 *
 * @param {{editorialFcpScore:?number, algorithmUsable:?number}} input
 * @return {{score:?number, source:'ensemble'|'fcp_only'|'alg_only'|'none',
 *   fcpAtFloor:boolean, disagreement:?number, reasons:Array<string>, warnings:Array<string>}}
 */
module.exports = function calculatePreseasonEnsemble({editorialFcpScore, algorithmUsable}) {
    const fcpAtFloor = editorialFcpScore === FCP_FLOOR;
    const fcpUsable = editorialFcpScore != null && !fcpAtFloor;
    const algUsable = algorithmUsable != null;
    const reasons = [];
    const warnings = [];

    if (fcpUsable && algUsable) {
        const disagreement = Math.abs(editorialFcpScore - algorithmUsable);
        reasons.push(`Ensemble FCP ${editorialFcpScore} / ALG ${algorithmUsable} (50/50)`);
        warnings.push("Ensemble FCP/ALG weights are an uncalibrated 50/50 baseline, pending early-season validation.");
        if (disagreement > DISAGREEMENT_THRESHOLD) {
            warnings.push("Editorial signals disagree (|FCP - ALG| > 20).");
        }
        return {score: Number(((editorialFcpScore + algorithmUsable) / 2).toFixed(2)), source: "ensemble", fcpAtFloor, disagreement, reasons, warnings};
    }
    if (algUsable) {
        reasons.push(`ALG ${algorithmUsable} (FCP ${fcpAtFloor ? "at floor value" : "missing"})`);
        if (fcpAtFloor) warnings.push("FCP is at its floor value (30): the FPEDIA page is likely not yet editorially reviewed.");
        return {score: algorithmUsable, source: "alg_only", fcpAtFloor, disagreement: null, reasons, warnings};
    }
    if (fcpUsable) {
        reasons.push(`FCP ${editorialFcpScore} (ALG not computed)`);
        warnings.push("ALG not computed for this player: technical prior uses FCP only.");
        return {score: editorialFcpScore, source: "fcp_only", fcpAtFloor, disagreement: null, reasons, warnings};
    }
    warnings.push("No editorial signal usable: technical prior unavailable from FCP/ALG.");
    return {score: null, source: "none", fcpAtFloor, disagreement: null, reasons, warnings};
};
