"use strict";
const getPlayers = require("../jobs/getPlayers");
const getFpediaStatus = require("../jobs/getFpediaStatus");

/**
 * FPEDIA enrichment progress, for the admin panel's progress bar. The denominator is
 * `IDENTIFIED` (active players FPEDIA has ever been matched to), not the full listone size:
 * `listFpediaSyncCandidates` (apps/api/src/sources/jobs) only ever selects players with a
 * resolved FPEDIA identity, so a player the listone knows but FPEDIA's own index never
 * covered is not "pending" — no batch can reach them. Measuring progress against the full
 * roster made a fully-caught-up batch look permanently stuck at <100%; `unmatched` reports
 * that gap honestly instead, as a fact about data coverage rather than unfinished work.
 * Enrichment is a live long-running job, so this is derived fresh on every request.
 */
module.exports = async function buildFpediaProgress() {
    const [players, statusCounts] = await Promise.all([getPlayers(), getFpediaStatus()]);
    const counts = statusCounts || {};
    const success = counts.SUCCESS || 0;
    const failedRetryable = counts.FAILED_RETRYABLE || 0;
    const needsReview = counts.NEEDS_REVIEW || 0;
    const notFound = counts.NOT_FOUND || 0;
    const total = players.length;
    const identified = counts.IDENTIFIED || 0;
    const unmatched = Math.max(0, total - identified);
    const attempted = Math.min(identified, success + failedRetryable + needsReview + notFound);
    const pending = Math.max(0, identified - attempted);
    return {
        total,
        identified,
        unmatched,
        success,
        failedRetryable,
        needsReview,
        notFound,
        pending,
        attempted,
        percentComplete: identified > 0 ? Math.round((attempted / identified) * 100) : 0,
        complete: identified > 0 && pending === 0
    };
};
