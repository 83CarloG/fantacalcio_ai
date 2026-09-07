"use strict";
const recalculateIndicators = require("../../src/indicators/services/recalculateIndicators");
const enrichFpedia = require("../../src/sources/services/enrichFpedia");
const getSeasonStatsCoverage = require("../../src/sources/services/getSeasonStatsCoverage");
const listImportRunHistory = require("../../src/sources/services/listImportRunHistory");

// Read-only diagnostic view composing four independent status reads (indicator staleness,
// FPEDIA identity/sync coverage, season-stats coverage, import run history) — a deliberate,
// small extension of the "2-3 services in one route" pattern already used elsewhere
// (e.g. GET /players in the Web BFF): every call here is a read, nothing is chained/written.
module.exports = async function dataHealthRoutes(fastify) {
    fastify.get("/v1/data-health", async function (_request, reply) {
        const [indicatorStaleness, fpediaStatus, seasonStatsCoverage, importHistory] = await Promise.all([
            recalculateIndicators.staleness(),
            enrichFpedia.status(),
            getSeasonStatsCoverage(),
            listImportRunHistory({limit: 10})
        ]);
        return reply.send({data: {indicatorStaleness, fpediaStatus, seasonStatsCoverage, importHistory}});
    });
};
