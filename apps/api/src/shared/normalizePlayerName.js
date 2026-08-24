"use strict";

/**
 * Lowercase, accent-stripped, punctuation-collapsed form of a player name, used for
 * deterministic cross-source matching and search. Generic/non-business utility (Luminous
 * "modular monolith" `/shared` — see docs/reference/LUMINOUS_ARCHITECTURE.md); deliberately
 * NOT under a `jobs/` subfolder so it isn't classified as a layer by
 * scripts/check-luminous-boundaries.js — any job may call it directly like a small library.
 *
 * @param {?string} name
 * @return {string}
 */
module.exports = function normalizePlayerName(name) {
    if (!name) return "";
    return name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};
