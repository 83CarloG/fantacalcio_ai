"use strict";
const normalizePlayerName = require("../../shared/normalizePlayerName");

// Fantacalcio.it abbreviates only when needed, e.g. "Paz N." (surname + given-name
// initial + period). A plain multi-word surname like "De Gea" has no trailing
// "<letter>." token, so it must NOT be mistaken for an abbreviation.
const ABBREVIATION_PATTERN = /^(.+)\s+([A-Za-z])\.$/;

function findCandidates(fpediaIndex, {normalizedSurname, initial, role, requireSameRole}) {
    return fpediaIndex.filter(function (entry) {
        if (requireSameRole && role && entry.role !== role) return false;
        const normalizedFull = normalizePlayerName(entry.fullName);
        if (!normalizedFull.startsWith(normalizedSurname)) return false;
        // word-boundary guard: a bare startsWith would let "Zappa" match "ZAPPACOSTA" (a
        // real false positive seen live — 2026-08 listone import), since "zappacosta" is
        // also a string-prefix of "zappa". The character right after the matched surname
        // must be a space (a new word starting) or nothing (an exact-length match).
        const boundaryOk = normalizedFull.length === normalizedSurname.length
            || normalizedFull[normalizedSurname.length] === " ";
        if (!boundaryOk) return false;
        if (!initial) return true;
        const rest = normalizedFull.slice(normalizedSurname.length).trim();
        return rest.length > 0 && rest[0] === initial;
    });
}

/**
 * Deterministic identity match: Fantacalcio.it gives abbreviated names, FPEDIA gives full
 * "SURNAME GIVENNAME". Match on normalized surname (+ given-name initial when Fantacalcio
 * abbreviates), anchored at a word boundary so "Zappa" can never match "Zappacosta". Never
 * fuzzy — pure lookup, so a bad match never silently happens; ambiguity is surfaced, not
 * guessed away.
 *
 * Role is a *disambiguation preference*, not a filter: Fantacalcio.it is this system's
 * source of truth for a player's role, and FPEDIA's own role-index page for a player
 * disagrees with it often enough (wing-backs D/C, trequartisti C/A — ~30 players in a
 * single listone import) that requiring agreement would silently drop real matches. A
 * same-role candidate is tried first purely because it is the cheaper, more targeted
 * disambiguator when several same-surname players exist; only when it finds nothing does
 * the search widen across every role.
 *
 * @param {{name:string, role:?string}} player a Fantacalcio listone record
 * @param {Array<{fpediaId:number,fullName:string,team:?string,role:string,url:string}>} fpediaIndex
 * @return {{status:'MATCHED',entry:object}|{status:'NOT_FOUND'}|{status:'AMBIGUOUS',candidates:Array}}
 */
module.exports = function matchFpediaIdentity(player, fpediaIndex) {
    const abbreviation = (player.name || "").match(ABBREVIATION_PATTERN);
    const surnamePart = abbreviation ? abbreviation[1] : player.name;
    const initial = abbreviation ? abbreviation[2].toLowerCase() : null;
    const normalizedSurname = normalizePlayerName(surnamePart);
    const params = {normalizedSurname, initial, role: player.role};

    let candidates = findCandidates(fpediaIndex, {...params, requireSameRole: true});
    if (candidates.length === 0) candidates = findCandidates(fpediaIndex, {...params, requireSameRole: false});

    if (candidates.length === 0) return {status: "NOT_FOUND"};
    if (candidates.length > 1) return {status: "AMBIGUOUS", candidates};
    return {status: "MATCHED", entry: candidates[0]};
};
