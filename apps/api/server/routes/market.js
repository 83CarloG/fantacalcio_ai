"use strict";
const getMarketModel = require("../../src/market/services/getMarketModel");
module.exports = async function marketRoutes(fastify) {
    fastify.get("/v1/market/model", async function (_request, reply) { return reply.send({data: await getMarketModel()}); });
};
