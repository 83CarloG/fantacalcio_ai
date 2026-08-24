"use strict";
const importMatchday = require("../../src/matchdays/services/importMatchday");
const recalculateIndicators = require("../../src/indicators/services/recalculateIndicators");

module.exports = async function matchdaysRoutes(fastify) {
    // Manual, on-demand (per the current lifecycle decision — see docs on ingestion timing):
    // an admin/operator supplies pre-parsed per-player stat lines for one matchday once
    // Fantacalcio.it has consolidated votes/stats for it. There is no automatic
    // detection of "matchday closed" and no built-in collector for the source page —
    // both are explicitly out of scope here (see src/matchdays/features/importMatchdayStats.js).
    fastify.post("/v1/matchdays/:number/import", async function (request, reply) {
        const matchdayNumber = Number(request.params.number);
        const stats = Array.isArray(request.body) ? request.body : [];
        const imported = await importMatchday(matchdayNumber, stats);
        const recalculated = await recalculateIndicators.all();
        return reply.send({data: {matchdayNumber, imported, recalculated: recalculated.recalculated}});
    });
};
