"use strict";
const evaluateBid = require("../../src/auction/services/evaluateBid");
module.exports = async function auctionRoutes(fastify) {
    fastify.post("/v1/auction/evaluate", async function (request, reply) { return reply.send({data: await evaluateBid(request.body || {})}); });
};
