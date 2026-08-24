"use strict";
const listPlayers = require("../../src/players/services/listPlayers");
const getPlayer = require("../../src/players/services/getPlayer");
const getPlayerIndicators = require("../../src/indicators/services/getPlayerIndicators");
const recalculateIndicators = require("../../src/indicators/services/recalculateIndicators");
module.exports = async function playerRoutes(fastify) {
    fastify.get("/v1/players", async function (request, reply) {
        const data = await listPlayers({role: request.query && request.query.role});
        return reply.send({data});
    });
    fastify.get("/v1/players/:id", async function (request, reply) {
        const data = await getPlayer({playerId: request.params.id});
        if (!data) return reply.code(404).send({error: "player_not_found"});
        return reply.send({data});
    });
    fastify.get("/v1/players/:id/indicators", async function (request, reply) {
        const data = await getPlayerIndicators({playerId: request.params.id});
        if (!data) return reply.code(404).send({error: "player_or_snapshot_not_found"});
        return reply.send({data});
    });
    // manual admin trigger; also run automatically after an FPEDIA enrichment batch and
    // after dataset snapshot creation (see routes/sources.js) — always synchronous here
    // since a pure recompute over already-stored data is fast, unlike the FPEDIA fetches.
    fastify.post("/v1/indicators/recalculate", async function (_request, reply) {
        const data = await recalculateIndicators.all();
        return reply.send({data});
    });
};
