"use strict";
const importFantacalcioListone = require("../features/importFantacalcioListone");
const buildFpediaPlayerIndex = require("../features/buildFpediaPlayerIndex");
const reconcilePlayerIdentity = require("../features/reconcilePlayerIdentity");

/**
 * Import the Fantacalcio.it listone, then resolve each player's full name against FPEDIA
 * (falling back to the player's own Fantacalcio.it detail page). Identity resolution is
 * best-effort: the listone import itself is the canonical-eligibility write and must
 * succeed even if FPEDIA is unreachable or a single player's fallback fetch fails — a
 * player just keeps its abbreviated name until the next successful reconciliation.
 */
module.exports = async function importFantacalcioListoneService(url) {
    const {players, ...result} = await importFantacalcioListone(url);

    let fpediaIndex;
    try {
        fpediaIndex = await buildFpediaPlayerIndex();
    } catch (error) {
        return {...result, identity: {reconciled: 0, total: players.length, error: error.message}};
    }

    let reconciled = 0;
    for (const player of players) {
        try {
            const outcome = await reconcilePlayerIdentity(player, fpediaIndex);
            if (outcome.status === "MATCHED" || outcome.status === "MATCHED_VIA_FALLBACK") reconciled += 1;
        } catch (_error) {
            // best-effort: one bad detail-page fallback fetch must not abort the whole import
        }
    }
    return {...result, identity: {reconciled, total: players.length}};
};
