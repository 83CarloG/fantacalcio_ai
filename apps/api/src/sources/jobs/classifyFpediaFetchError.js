"use strict";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * Classify a failed FPEDIA detail-page fetch/parse into how the batch runner should record
 * it (see features/enrichFpediaBatch.js): retryable transient failures get another attempt
 * on a later run; a 404 means the page genuinely doesn't exist (not blocking — the player
 * just has no FPEDIA enrichment); anything else unexpected is flagged for a human to look at
 * rather than silently retried forever or silently ignored.
 *
 * @param {Error} error
 * @return {'NOT_FOUND'|'FAILED_RETRYABLE'|'NEEDS_REVIEW'}
 */
module.exports = function classifyFpediaFetchError(error) {
    const statusMatch = String((error && error.message) || "").match(/^HTTP (\d+)/);
    const status = statusMatch ? Number(statusMatch[1]) : null;
    if (status === 404) return "NOT_FOUND";
    if (status !== null && RETRYABLE_STATUS.has(status)) return "FAILED_RETRYABLE";
    if (error && (error.name === "TimeoutError" || error.name === "AbortError")) return "FAILED_RETRYABLE";
    return "NEEDS_REVIEW";
};
