"use strict";
const normalizePlayerName = require("../../shared/normalizePlayerName");

// Fantacalcio.it abbreviates only when needed, e.g. "Paz N." (surname + given-name
// initial + period). A plain multi-word surname like "De Gea" has no trailing
// "<letter>." token, so it must NOT be mistaken for an abbreviation.
const ABBREVIATION_PATTERN = /^(.+)\s+([A-Za-z])\.$/;

/**
 * Deterministic identity match: Fantacalcio.it gives abbreviated names, FPEDIA gives full
 * "SURNAME GIVENNAME". Match on normalized surname (+ given-name initial when Fantacalcio
 * abbreviates), scoped to the same role to cut down surname collisions. Never fuzzy — pure
 * lookup, so a bad match never silently happens; ambiguity is surfaced, not guessed away.
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

    const candidates = fpediaIndex.filter(function (entry) {
        if (player.role && entry.role !== player.role) return false;
        const normalizedFull = normalizePlayerName(entry.fullName);
        if (!normalizedFull.startsWith(normalizedSurname)) return false;
        if (!initial) return true;
        const rest = normalizedFull.slice(normalizedSurname.length).trim();
        return rest.length > 0 && rest[0] === initial;
    });

    if (candidates.length === 0) return {status: "NOT_FOUND"};
    if (candidates.length > 1) return {status: "AMBIGUOUS", candidates};
    return {status: "MATCHED", entry: candidates[0]};
};
