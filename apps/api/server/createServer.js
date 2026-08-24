"use strict";
const Fastify = require("fastify");
const cors = require("@fastify/cors");
const swagger = require("@fastify/swagger");
const swaggerUi = require("@fastify/swagger-ui");
const healthRoutes = require("./routes/health");
const playerRoutes = require("./routes/players");
const marketRoutes = require("./routes/market");
const auctionRoutes = require("./routes/auction");
const sourcesRoutes = require("./routes/sources");
const snapshotsRoutes = require("./routes/snapshots");
const matchdaysRoutes = require("./routes/matchdays");

module.exports = async function createServer() {
    const app = Fastify({logger: true});
    await app.register(cors, {origin: false});
    await app.register(swagger, {openapi: {info: {title: "Fanta Luminous API", version: "0.1.0"}}});
    await app.register(swaggerUi, {routePrefix: "/docs"});
    await app.register(healthRoutes);
    await app.register(playerRoutes);
    await app.register(marketRoutes);
    await app.register(auctionRoutes);
    await app.register(sourcesRoutes);
    await app.register(snapshotsRoutes);
    await app.register(matchdaysRoutes);
    return app;
};
