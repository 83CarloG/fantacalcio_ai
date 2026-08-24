"use strict";
module.exports = async function healthRoutes(fastify) {
    fastify.get("/v1/health", async function () { return {status: "ok", service: "fanta-api"}; });
};
