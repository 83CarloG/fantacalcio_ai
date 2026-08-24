"use strict";
const importFantacalcioListone = require("../../src/sources/services/importFantacalcioListone");
const importSeasonStats = require("../../src/sources/services/importSeasonStats");
const enrichFpedia = require("../../src/sources/services/enrichFpedia");
const recalculateIndicators = require("../../src/indicators/services/recalculateIndicators");

const FPEDIA_MODES = {full: enrichFpedia.full, stale: enrichFpedia.stale, "retry-failed": enrichFpedia.retryFailed};

module.exports = async function sourcesRoutes(fastify) {
    // On-demand only: this makes live outbound requests to Fantacalcio.it and writes ~500
    // rows, so it is never run as part of bootstrap/seed (see ADR-0005).
    // Fire-and-forget, like the FPEDIA batch below and for the same reason: the full import
    // (1 bulk fetch + ~1000 writes + per-player identity reconciliation, which can fall back
    // to one detail-page fetch per unmatched player) runs for minutes, well past the BFF's
    // 20s HTTP client timeout (apps/web-bff/src/drivers/backendApi.js). The response confirms
    // the run started; the outcome is polled from the status endpoint below.
    fastify.post("/v1/sources/fantacalcio/listone", async function (request, reply) {
        const data = await importFantacalcioListone.start(request.body && request.body.url);
        return reply.code(202).send({data});
    });

    fastify.get("/v1/sources/fantacalcio/listone/status", async function (request, reply) {
        return reply.send({data: await importFantacalcioListone.status()});
    });

    // Fire-and-forget: a full FPEDIA batch touches ~500 pages at 2 requests/s-ish with
    // jitter, which can run several minutes — well past the BFF's 20s HTTP client timeout
    // (apps/web-bff/src/drivers/backendApi.js). The response confirms the run started;
    // progress/outcome is polled separately via GET /v1/sources/fpedia/status. Progress is
    // persisted per player (player_source_sync_state) as it happens, not held in memory, so
    // a crash mid-run loses nothing but the players not yet reached in this pass.
    fastify.post("/v1/sources/fpedia/enrich", async function (request, reply) {
        const mode = (request.body && request.body.mode) || "full";
        const run = FPEDIA_MODES[mode];
        if (!run) return reply.code(400).send({error: "invalid_mode"});
        // recalculation is chained here (route level), not inside the enrichFpedia service:
        // Luminous forbids a service from calling another service, and this composition
        // ("run source X, then recompute what depends on it") is exactly what the route/CLI
        // caller layer is for.
        run()
            .then(() => recalculateIndicators.all())
            .catch(function (error) { request.log.error({error: error.message}, "fpedia enrich batch failed"); });
        return reply.code(202).send({data: {status: "started", mode}});
    });

    fastify.get("/v1/sources/fpedia/status", async function (request, reply) {
        const data = await enrichFpedia.status();
        return reply.send({data});
    });

    // Manual, on-demand (lifecycle decision): one bulk request imports every player's
    // cumulative season stats; as_of_matchday is self-derived from max PV (see the feature).
    // Synchronous like the listone import (single fetch + ~500 upserts + fast recalc), and
    // recalculation is chained here at the route layer — Luminous forbids service→service.
    fastify.post("/v1/sources/fantacalcio/season-stats", async function (request, reply) {
        const data = await importSeasonStats(request.body && request.body.url);
        if (data.seasonStarted) await recalculateIndicators.all();
        return reply.send({data});
    });
};
