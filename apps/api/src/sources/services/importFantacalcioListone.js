"use strict";
const importFantacalcioListone = require("../features/importFantacalcioListone");
const buildFpediaPlayerIndex = require("../features/buildFpediaPlayerIndex");
const reconcilePlayerIdentity = require("../features/reconcilePlayerIdentity");
const startImportRun = require("../jobs/startImportRun");
const finishImportRun = require("../jobs/finishImportRun");
const getLatestImportRun = require("../jobs/getLatestImportRun");

const IMPORT_TYPE = "LISTONE";

/**
 * Import the Fantacalcio.it listone, then resolve each player's full name against FPEDIA
 * (falling back to the player's own Fantacalcio.it detail page). Identity resolution is
 * best-effort: the listone import itself is the canonical-eligibility write and must
 * succeed even if FPEDIA is unreachable or a single player's fallback fetch fails — a
 * player just keeps its abbreviated name until the next successful reconciliation.
 *
 * Runs to completion; used directly by the CLI (scripts/import-fantacalcio-listone.js),
 * where there is no response deadline to respect. HTTP callers use `start` instead.
 */
async function run(url) {
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
}

/**
 * Start `run` in the background and return as soon as the run is on record.
 *
 * A full listone import is one ~1MB fetch, ~1000 writes and up to one detail-page fetch per
 * unmatched player: minutes, not seconds. Answering it inside the POST meant every caller
 * saw a timeout (the Web BFF's driver gives up at 20s) while the import was still running
 * happily server-side — the work succeeded and the user was told it had failed. Progress is
 * therefore reported through `status`, exactly as the FPEDIA batch already does.
 *
 * Concurrent starts are refused rather than queued: two overlapping imports would race on
 * the same player rows and on markPlayersRemoved, whose whole meaning is "everything absent
 * from THIS import" — a half-finished second run would mark live players REMOVED.
 */
async function start(url) {
    const latest = await getLatestImportRun(IMPORT_TYPE);
    if (latest && latest.status === "RUNNING") {
        return {status: "already_running", runId: latest.runId, startedAt: latest.startedAt};
    }
    const runId = await startImportRun(IMPORT_TYPE);
    // deliberately not awaited: the caller gets 202 and polls `status`
    run(url)
        .then((result) => finishImportRun({runId, status: "SUCCESS", result}))
        .catch((error) => finishImportRun({runId, status: "FAILED", error: error.message}));
    return {status: "started", runId};
}

module.exports = {run, start, status: () => getLatestImportRun(IMPORT_TYPE)};
