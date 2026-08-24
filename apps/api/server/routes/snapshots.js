"use strict";
const createDatasetSnapshot = require("../../src/snapshots/services/createDatasetSnapshot");
const listDatasetSnapshots = require("../../src/snapshots/services/listDatasetSnapshots");
const getDatasetSnapshot = require("../../src/snapshots/services/getDatasetSnapshot");
const recalculateIndicators = require("../../src/indicators/services/recalculateIndicators");

const VALID_TYPES = new Set(["POST_MARKET_BASELINE", "AUCTION_SNAPSHOT", "MANUAL"]);

module.exports = async function snapshotsRoutes(fastify) {
    fastify.get("/v1/snapshots", async function (_request, reply) {
        return reply.send({data: await listDatasetSnapshots()});
    });

    fastify.get("/v1/snapshots/:id", async function (request, reply) {
        const data = await getDatasetSnapshot(request.params.id);
        if (!data) return reply.code(404).send({error: "dataset_snapshot_not_found"});
        return reply.send({data});
    });

    // synchronous: this only reads/writes already-stored data for ~500 players, unlike the
    // FPEDIA batch — no fire-and-forget needed. `type` chooses the immutable label prefix;
    // creation itself is the lock, nothing here is ever updated afterward.
    fastify.post("/v1/snapshots", async function (request, reply) {
        const body = request.body || {};
        const type = body.type;
        if (!VALID_TYPES.has(type)) return reply.code(400).send({error: "invalid_type"});
        const created = await createDatasetSnapshot({
            type, label: body.label, matchdaysIncluded: body.matchdaysIncluded, notes: body.notes
        });
        // pin the indicators computed right now to this same dataset, same reasoning as
        // sources.js chaining recalculation after FPEDIA enrichment: a service may not call
        // another service, so this is sequenced here at the route layer instead.
        await recalculateIndicators.all(created.datasetSnapshotId);
        return reply.code(201).send({data: created});
    });
};
