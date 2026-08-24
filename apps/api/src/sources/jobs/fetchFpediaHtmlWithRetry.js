"use strict";
const http = require("../../drivers/http");

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 800;

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

/**
 * Fetch one FPEDIA URL with exponential backoff + jitter for transient failures (timeout,
 * 429, 5xx). A non-retryable failure (404, any other 4xx) or exhausting MAX_ATTEMPTS throws
 * for the caller to classify and persist (see jobs/classifyFpediaFetchError.js).
 */
module.exports = async function fetchFpediaHtmlWithRetry(url) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
            return await http(url);
        } catch (error) {
            lastError = error;
            const statusMatch = String(error.message || "").match(/^HTTP (\d+)/);
            const status = statusMatch ? Number(statusMatch[1]) : null;
            const isTimeout = error.name === "TimeoutError" || error.name === "AbortError";
            const retryable = isTimeout || (status !== null && RETRYABLE_STATUS.has(status));
            if (!retryable || attempt === MAX_ATTEMPTS) throw error;
            await sleep(BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 400);
        }
    }
    throw lastError;
};
