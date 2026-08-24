"use strict";
const matchFpediaIdentity = require("../jobs/matchFpediaIdentity");
const collectFantacalcio = require("../operations/collectFantacalcio");
const resolveFullName = require("../jobs/resolveFullName");
const upsertPlayerIdentity = require("../jobs/upsertPlayerIdentity");

/**
 * Resolve one player's full name across sources and persist it. Primary source is FPEDIA
 * (matched deterministically against the pre-built role index — no extra HTTP call per
 * player); if FPEDIA has no match, falls back to the player's own Fantacalcio.it detail
 * page. An ambiguous FPEDIA match (multiple same-surname candidates in the same role) is
 * treated the same as not found — never guessed — and simply leaves full_name unresolved
 * for now rather than risking a wrong identity.
 *
 * @param {{fantacalcioPlayerId:number, name:string, role:?string, fantacalcioUrl:?string}} player
 * @param {Array} fpediaIndex pre-built via features/buildFpediaPlayerIndex
 * @return {{status:string}}
 */
module.exports = async function reconcilePlayerIdentity(player, fpediaIndex) {
    const match = matchFpediaIdentity(player, fpediaIndex);

    if (match.status === "MATCHED") {
        await upsertPlayerIdentity({
            playerId: player.fantacalcioPlayerId,
            source: "fpedia",
            sourceId: match.entry.fpediaId,
            sourceUrl: match.entry.url,
            rawName: match.entry.fullName,
            fullName: resolveFullName({fpediaFullName: match.entry.fullName})
        });
        return {status: "MATCHED"};
    }

    // NOT_FOUND or AMBIGUOUS: fall back to the player's own Fantacalcio.it detail page,
    // which is the canonical eligibility source and always has *a* name, even if FPEDIA
    // doesn't cover this player (new arrival, obscure squad player, etc.).
    if (player.fantacalcioUrl) {
        const collected = await collectFantacalcio(player.fantacalcioUrl);
        const fallbackName = collected.data && collected.data.name;
        if (fallbackName) {
            await upsertPlayerIdentity({
                playerId: player.fantacalcioPlayerId,
                source: "fantacalcio",
                sourceId: player.fantacalcioPlayerId,
                sourceUrl: player.fantacalcioUrl,
                rawName: fallbackName,
                fullName: resolveFullName({fallbackName})
            });
            return {status: "MATCHED_VIA_FALLBACK"};
        }
    }

    return {status: match.status}; // NOT_FOUND or AMBIGUOUS, nothing persisted
};
