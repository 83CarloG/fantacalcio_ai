"use strict";
const database = require("../../drivers/database");

/**
 * Persist per-player FPEDIA enrichment state, so a batch run survives restarts/crashes: the
 * next run just re-queries for non-SUCCESS rows (see jobs/listFpediaSyncCandidates.js)
 * instead of relying on anything held in memory.
 *
 * @param {{playerId:number, status:string, error?:?string, backoffMs?:number}} input
 */
module.exports = async function upsertFpediaSyncState({playerId, status, error = null, backoffMs = 0}) {
    const db = database();
    const now = new Date().toISOString();
    const nextRetryAt = backoffMs ? new Date(Date.now() + backoffMs).toISOString() : null;
    db.prepare(`
        INSERT INTO player_source_sync_state(player_id, source, status, attempts, last_attempt_at, last_error, next_retry_at, updated_at)
        VALUES (?, 'fpedia', ?, 1, ?, ?, ?, ?)
        ON CONFLICT(player_id, source) DO UPDATE SET
            status = excluded.status,
            attempts = player_source_sync_state.attempts + 1,
            last_attempt_at = excluded.last_attempt_at,
            last_error = excluded.last_error,
            next_retry_at = excluded.next_retry_at,
            updated_at = excluded.updated_at
    `).run(playerId, status, now, error, nextRetryAt, now);
};
