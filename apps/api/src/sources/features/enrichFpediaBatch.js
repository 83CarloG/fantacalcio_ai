"use strict";
const listFpediaSyncCandidates = require("../jobs/listFpediaSyncCandidates");
const collectFpediaPlayerDetail = require("../operations/collectFpediaPlayerDetail");
const upsertFpediaSyncState = require("../jobs/upsertFpediaSyncState");
const classifyFpediaFetchError = require("../jobs/classifyFpediaFetchError");
const recordPlayerSnapshot = require("../jobs/recordPlayerSnapshot");

const CONCURRENCY = 2;
const MIN_DELAY_MS = 600;
const JITTER_MS = 600;
// a FAILED_RETRYABLE player is skipped for a while so the same failing request isn't
// hammered again within the same run or an immediately-following one
const RETRY_BACKOFF_MS = 30 * 60 * 1000;

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

/**
 * Run a controlled-concurrency FPEDIA enrichment pass over the candidates for `mode`
 * (see jobs/listFpediaSyncCandidates.js). Resumable by construction — progress is persisted
 * to player_source_sync_state after every single player, not batched in memory, so a crash
 * or restart mid-run just leaves the untouched players PENDING/FAILED_RETRYABLE for the next
 * run to pick back up.
 *
 * @param {'full'|'stale'|'retry-failed'} mode
 * @return {{total:number, succeeded:number, failed:number}}
 */
module.exports = async function enrichFpediaBatch(mode) {
    const candidates = await listFpediaSyncCandidates(mode);
    let cursor = 0;
    let succeeded = 0;
    let failed = 0;

    async function worker() {
        while (cursor < candidates.length) {
            const candidate = candidates[cursor];
            cursor += 1;
            try {
                const detail = await collectFpediaPlayerDetail(candidate.url);
                await recordPlayerSnapshot({
                    playerId: candidate.playerId,
                    snapshotType: "FPEDIA_REFRESH",
                    payload: {sources: {fpedia: {status: "success", url: candidate.url, data: detail}}}
                });
                // parsing ambiguities (e.g. a min>max projection range) are never silently
                // fixed: the snapshot is still stored (the rest of the data is valid) but the
                // player is flagged for a human to look at instead of counted as clean
                const ambiguities = detail.parsingAmbiguities || [];
                if (ambiguities.length > 0) {
                    await upsertFpediaSyncState({playerId: candidate.playerId, status: "NEEDS_REVIEW", error: ambiguities.join("; ")});
                    failed += 1;
                } else {
                    await upsertFpediaSyncState({playerId: candidate.playerId, status: "SUCCESS"});
                    succeeded += 1;
                }
            } catch (error) {
                const classification = classifyFpediaFetchError(error);
                await upsertFpediaSyncState({
                    playerId: candidate.playerId,
                    status: classification,
                    error: error.message,
                    backoffMs: classification === "FAILED_RETRYABLE" ? RETRY_BACKOFF_MS : 0
                });
                failed += 1;
            }
            await sleep(MIN_DELAY_MS + Math.random() * JITTER_MS);
        }
    }

    await Promise.all(Array.from({length: Math.min(CONCURRENCY, candidates.length)}, worker));
    return {total: candidates.length, succeeded, failed};
};
