"use strict";
const dashboard = require("../../src/dashboard/services/dashboard");
const listPlayers = require("../../src/players/services/listPlayers");
const getPlayerPage = require("../../src/players/services/getPlayerPage");
const importListone = require("../../src/players/services/importListone");
const enrichFpedia = require("../../src/players/services/enrichFpedia");
const getFpediaStatus = require("../../src/players/services/getFpediaStatus");
const recalculateIndicators = require("../../src/players/services/recalculateIndicators");
const createDatasetSnapshot = require("../../src/players/services/createDatasetSnapshot");
const importSeasonStats = require("../../src/players/services/importSeasonStats");

// HTTP input validation is a route concern (SYSTEM.md): only build a bidInput when all
// three fields are present and numeric, otherwise the page renders without an evaluation.
function parseBidQuery(query) {
    if (!query || !query.currentBid || !query.availableBudget || !query.remainingSlots) return undefined;
    const currentBid = Number(query.currentBid);
    const availableBudget = Number(query.availableBudget);
    const remainingSlots = Number(query.remainingSlots);
    if (![currentBid, availableBudget, remainingSlots].every(Number.isFinite)) return undefined;
    return {currentBid, availableBudget, remainingSlots};
}

const FPEDIA_MODES = new Set(["full", "stale", "retry-failed"]);
// path segment -> API snapshot type; kept as a URL param rather than a posted body field
// because this server's form-urlencoded parser deliberately discards the body (see
// createServer.js) — no route has needed one until now, so this avoids pulling in a new
// dependency (@fastify/formbody) just for two fields.
const SNAPSHOT_TYPES = {"post-market-baseline": "POST_MARKET_BASELINE", "auction-snapshot": "AUCTION_SNAPSHOT"};

module.exports = async function pageRoutes(fastify) {
    fastify.get("/", async function (request, reply) { return reply.view("dashboard.handlebars", {...await dashboard(), path: request.url}); });
    fastify.get("/design-system", async function (request, reply) { return reply.view("design-system.handlebars", {title: "Design System", path: request.url}); });
    fastify.get("/players", async function (request, reply) {
        const query = request.query || {};
        return reply.view("players.handlebars", {
            title: "Giocatori",
            players: await listPlayers(query.role),
            fpediaStatus: await getFpediaStatus(),
            path: request.url,
            // flash state from the admin action redirects below, read once and not persisted anywhere
            imported: query.imported,
            importError: query.importError,
            fpediaStarted: query.fpediaStarted,
            fpediaError: query.fpediaError,
            recalculated: query.recalculated,
            recalculateError: query.recalculateError,
            snapshotCreated: query.snapshotCreated,
            snapshotError: query.snapshotError,
            statsImported: query.statsImported,
            statsMatchday: query.statsMatchday,
            statsNotStarted: query.statsNotStarted,
            statsError: query.statsError
        });
    });
    fastify.post("/players/import", async function (_request, reply) {
        // Fastify 5's reply.redirect() takes (url, code) — url first, code second
        try {
            const result = await importListone();
            return reply.redirect(`/players?imported=${result.imported}`, 303);
        } catch (error) {
            return reply.redirect(`/players?importError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/players/fpedia/enrich/:mode", async function (request, reply) {
        const mode = request.params.mode;
        if (!FPEDIA_MODES.has(mode)) return reply.redirect("/players?fpediaError=invalid_mode", 303);
        try {
            await enrichFpedia(mode);
            return reply.redirect(`/players?fpediaStarted=${mode}`, 303);
        } catch (error) {
            return reply.redirect(`/players?fpediaError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/players/indicators/recalculate", async function (_request, reply) {
        try {
            const result = await recalculateIndicators();
            return reply.redirect(`/players?recalculated=${result.recalculated}`, 303);
        } catch (error) {
            return reply.redirect(`/players?recalculateError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/players/season-stats/import", async function (_request, reply) {
        try {
            const result = await importSeasonStats();
            if (!result.seasonStarted) return reply.redirect("/players?statsNotStarted=1", 303);
            return reply.redirect(`/players?statsImported=${result.imported}&statsMatchday=${result.asOfMatchday}`, 303);
        } catch (error) {
            return reply.redirect(`/players?statsError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/players/snapshots/:type", async function (request, reply) {
        const type = SNAPSHOT_TYPES[request.params.type];
        if (!type) return reply.redirect("/players?snapshotError=invalid_type", 303);
        try {
            const result = await createDatasetSnapshot(type);
            return reply.redirect(`/players?snapshotCreated=${encodeURIComponent(result.label)}`, 303);
        } catch (error) {
            return reply.redirect(`/players?snapshotError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.get("/players/:id", async function (request, reply) {
        const viewModel = await getPlayerPage(request.params.id, parseBidQuery(request.query));
        // the progressive-enhancement fetch in app.js asks for JSON to update the result panel
        // in place instead of a full navigation; the plain <form method="get"> keeps working without it
        if (request.headers.accept === "application/json") {
            return reply.send({evaluation: viewModel.evaluation, evaluationError: viewModel.evaluationError});
        }
        return reply.view("player.handlebars", {...viewModel, path: request.url});
    });
};
