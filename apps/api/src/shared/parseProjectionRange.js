"use strict";

/**
 * Parse one FPEDIA projection value into a structured range. The site labels these
 * "(range)" itself; three real forms observed live (2026-08-10):
 *   "4/7"  → closed range        {min:4,  max:7,    openEnded:false}
 *   "30+"  → open-ended range    {min:30, max:null, openEnded:true}
 *   "0"    → bare value          {min:0,  max:0,    openEnded:false}   (seen on Mascardi)
 *
 * The X/Y → min/max reading is the plausible-but-undeclared semantics: a closed range
 * with min > max is therefore NEVER silently swapped — it comes back with
 * `ambiguity` set so the caller can flag the player for manual review instead.
 *
 * Lives in /shared (not under a jobs/ folder) like normalizePlayerName/median: it's a pure
 * numeric-notation parser any layer may call directly without tripping the same-layer check.
 *
 * @param {?string} text raw projection text (already stripped of the "(range)" suffix)
 * @return {?{raw:string, min:?number, max:?number, openEnded:boolean, ambiguity:?string}}
 *         null when the input is empty/absent
 */
module.exports = function parseProjectionRange(text) {
    const raw = String(text ?? "").trim();
    if (raw === "") return null;

    const openMatch = raw.match(/^(\d+)\+$/);
    if (openMatch) {
        return {raw, min: Number(openMatch[1]), max: null, openEnded: true, ambiguity: null};
    }

    const closedMatch = raw.match(/^(\d+)\/(\d+)$/);
    if (closedMatch) {
        const min = Number(closedMatch[1]);
        const max = Number(closedMatch[2]);
        if (min > max) {
            return {raw, min: null, max: null, openEnded: false, ambiguity: `range min>max: ${raw}`};
        }
        return {raw, min, max, openEnded: false, ambiguity: null};
    }

    const bareMatch = raw.match(/^(\d+)$/);
    if (bareMatch) {
        const value = Number(bareMatch[1]);
        return {raw, min: value, max: value, openEnded: false, ambiguity: null};
    }

    return {raw, min: null, max: null, openEnded: false, ambiguity: `unrecognized range format: ${raw}`};
};
