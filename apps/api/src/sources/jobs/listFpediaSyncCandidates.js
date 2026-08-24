"use strict";
const database = require("../../drivers/database");

/**
 * Which ACTIVE players need an FPEDIA enrichment attempt, and with what FPEDIA URL
 * (resolved by identity reconciliation — see features/reconcilePlayerIdentity.js). A player
 * with no known FPEDIA identity is skipped: there is nothing to fetch for them yet.
 *
 * @param {'full'|'stale'|'retry-failed'|'force'} mode
 * @param {number} staleDays only used by 'stale'
 * @return {Array<{playerId:number, url:string}>}
 */
module.exports = async function listFpediaSyncCandidates(mode, staleDays = 14) {
    const db = database();
    const base = `
        SELECT p.player_id AS playerId, i.source_url AS url
        FROM players p
        JOIN player_source_identities i ON i.player_id = p.player_id AND i.source = 'fpedia'
        LEFT JOIN player_source_sync_state s ON s.player_id = p.player_id AND s.source = 'fpedia'
        WHERE p.status = 'ACTIVE'
    `;
    if (mode === "retry-failed") {
        return db.prepare(`${base} AND s.status = 'FAILED_RETRYABLE'`).all();
    }
    if (mode === "stale") {
        const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000).toISOString();
        return db.prepare(`${base} AND s.status = 'SUCCESS' AND s.updated_at < ?`).all(cutoff);
    }
    // 'force': every identity-mapped active player regardless of sync state — the mode to
    // use after a parser upgrade, when already-SUCCESS snapshots lack newly-extracted fields
    if (mode === "force") {
        return db.prepare(base).all();
    }
    // 'full': anything never successfully synced yet (never attempted, or attempted and not SUCCESS)
    return db.prepare(`${base} AND (s.status IS NULL OR s.status != 'SUCCESS')`).all();
};
