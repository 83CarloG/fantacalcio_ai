"use strict";
const dashboard = require("../../src/dashboard/services/dashboard");
const listPlayers = require("../../src/players/services/listPlayers");
const getPlayerPage = require("../../src/players/services/getPlayerPage");
const importListone = require("../../src/players/services/importListone");
const enrichFpedia = require("../../src/players/services/enrichFpedia");
const getFpediaProgress = require("../../src/players/services/getFpediaProgress");
const getListoneStatus = require("../../src/players/services/getListoneStatus");
const recalculateIndicators = require("../../src/players/services/recalculateIndicators");
const createDatasetSnapshot = require("../../src/players/services/createDatasetSnapshot");
const importSeasonStats = require("../../src/players/services/importSeasonStats");
const buildDataHealthView = require("../../src/dataHealth/services/dataHealth");
const buildAuctionLivePage = require("../../src/auction/services/auctionLivePage");
const createManager = require("../../src/auction/services/createManager");
const recordPick = require("../../src/auction/services/recordPick");
const deletePick = require("../../src/auction/services/deletePick");
const getSeasonRules = require("../../src/auction/services/getSeasonRules");
const upsertSeasonRules = require("../../src/auction/services/upsertSeasonRules");
const setManagerOwner = require("../../src/auction/services/setManagerOwner");
const advanceTurn = require("../../src/auction/services/advanceTurn");
const toggleTarget = require("../../src/auction/services/toggleTarget");
const buildWatchlistPage = require("../../src/auction/services/watchlistPage");
const resetAuction = require("../../src/auction/services/resetAuction");
const buildRosterWorkbook = require("../../src/auction/services/rosterWorkbook");

const CURRENT_SEASON = "2026-27";
const MAIN_LAYOUT = {layout: "layouts/main.handlebars"};

const FPEDIA_MODES = new Set(["full", "stale", "retry-failed"]);
// path segment -> API snapshot type; kept as a URL param rather than a posted body field
// because this server's form-urlencoded parser deliberately discards the body (see
// createServer.js) — no route has needed one until now, so this avoids pulling in a new
// dependency (@fastify/formbody) just for two fields.
const SNAPSHOT_TYPES = {"post-market-baseline": "POST_MARKET_BASELINE", "auction-snapshot": "AUCTION_SNAPSHOT"};

// whether the setup page's progress bar/status pill should keep polling this route for
// JSON updates: a listone import in flight, or an FPEDIA batch that has clearly started
// (some players already attempted) but not finished every player yet.
function shouldPoll(fpediaProgress, listoneRun) {
    if (listoneRun && listoneRun.status === "RUNNING") return true;
    return Boolean(fpediaProgress && fpediaProgress.attempted > 0 && !fpediaProgress.complete);
}

module.exports = async function pageRoutes(fastify) {
    fastify.get("/", async function (request, reply) { return reply.view("dashboard.handlebars", {...await dashboard(), path: request.url}, MAIN_LAYOUT); });
    fastify.get("/design-system", async function (request, reply) { return reply.view("design-system.handlebars", {title: "Design System", path: request.url}, MAIN_LAYOUT); });

    fastify.get("/players", async function (request, reply) {
        const query = request.query || {};
        const players = await listPlayers(query.role);
        return reply.view("players.handlebars", {title: "Giocatori", players, path: request.url}, MAIN_LAYOUT);
    });

    fastify.get("/setup", async function (request, reply) {
        const query = request.query || {};
        // the page's progress bar polls this same route for JSON every few seconds while
        // FPEDIA enrichment is running (see app.js) — a full status re-render on every poll
        // would be wasteful, so that branch answers with only the two status fragments.
        if (request.headers.accept === "application/json") {
            const [fpediaProgress, listoneRun] = await Promise.all([getFpediaProgress(), getListoneStatus()]);
            return reply.send({fpediaProgress, listoneRun, pollActive: shouldPoll(fpediaProgress, listoneRun)});
        }
        const [fpediaProgress, listoneRun, seasonRules] = await Promise.all([
            getFpediaProgress(), getListoneStatus(), getSeasonRules(CURRENT_SEASON)
        ]);
        return reply.view("setup.handlebars", {
            title: "Preparazione",
            fpediaProgress,
            listoneRun,
            seasonRules,
            pollActive: shouldPoll(fpediaProgress, listoneRun),
            path: request.url,
            // flash state from the action redirects below, read once and not persisted anywhere
            listoneStarted: query.listoneStarted,
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
            statsError: query.statsError,
            rulesSaved: query.rulesSaved,
            rulesError: query.rulesError
        }, MAIN_LAYOUT);
    });
    fastify.post("/setup/league-rules", async function (request, reply) {
        const body = request.body || {};
        const participants = Number(body.participants);
        const budgetPerManager = Number(body.budgetPerManager);
        const rosterSlots = {P: Number(body.slotsP), D: Number(body.slotsD), C: Number(body.slotsC), A: Number(body.slotsA)};
        if (![participants, budgetPerManager, rosterSlots.P, rosterSlots.D, rosterSlots.C, rosterSlots.A].every(Number.isFinite)) {
            return reply.redirect("/setup?rulesError=campi_mancanti", 303);
        }
        try {
            await upsertSeasonRules({season: CURRENT_SEASON, participants, budgetPerManager, rosterSlots});
            return reply.redirect("/setup?rulesSaved=1", 303);
        } catch (error) {
            return reply.redirect(`/setup?rulesError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/setup/import", async function (_request, reply) {
        // Fastify 5's reply.redirect() takes (url, code) — url first, code second
        // The API answers 202 as soon as the run is on record: this redirect reports that the
        // import STARTED, never that it finished. The outcome shows up in the run panel, fed
        // by GET /v1/sources/fantacalcio/listone/status.
        try {
            const result = await importListone();
            return reply.redirect(`/setup?listoneStarted=${encodeURIComponent(result.status)}`, 303);
        } catch (error) {
            return reply.redirect(`/setup?importError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/setup/fpedia/enrich/:mode", async function (request, reply) {
        const mode = request.params.mode;
        if (!FPEDIA_MODES.has(mode)) return reply.redirect("/setup?fpediaError=invalid_mode", 303);
        try {
            await enrichFpedia(mode);
            return reply.redirect(`/setup?fpediaStarted=${mode}`, 303);
        } catch (error) {
            return reply.redirect(`/setup?fpediaError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/setup/indicators/recalculate", async function (_request, reply) {
        try {
            const result = await recalculateIndicators();
            return reply.redirect(`/setup?recalculated=${result.recalculated}`, 303);
        } catch (error) {
            return reply.redirect(`/setup?recalculateError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/setup/season-stats/import", async function (_request, reply) {
        try {
            const result = await importSeasonStats();
            if (!result.seasonStarted) return reply.redirect("/setup?statsNotStarted=1", 303);
            return reply.redirect(`/setup?statsImported=${result.imported}&statsMatchday=${result.asOfMatchday}`, 303);
        } catch (error) {
            return reply.redirect(`/setup?statsError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/setup/snapshots/:type", async function (request, reply) {
        const type = SNAPSHOT_TYPES[request.params.type];
        if (!type) return reply.redirect("/setup?snapshotError=invalid_type", 303);
        try {
            const result = await createDatasetSnapshot(type);
            return reply.redirect(`/setup?snapshotCreated=${encodeURIComponent(result.label)}`, 303);
        } catch (error) {
            return reply.redirect(`/setup?snapshotError=${encodeURIComponent(error.message)}`, 303);
        }
    });

    fastify.get("/auction/live", async function (request, reply) {
        const query = request.query || {};
        return reply.view("auction-live.handlebars", {
            title: "Gestione asta",
            ...await buildAuctionLivePage(),
            path: request.url,
            managerAdded: query.managerAdded,
            managerError: query.managerError,
            pickRecorded: query.pickRecorded,
            pickError: query.pickError,
            pickDeleted: query.pickDeleted,
            ownerSet: query.ownerSet,
            resetDone: query.resetDone
        }, MAIN_LAYOUT);
    });
    fastify.post("/auction/live/managers", async function (request, reply) {
        const body = request.body || {};
        const budgetTotal = Number(body.budgetTotal);
        if (!body.name || !Number.isFinite(budgetTotal)) return reply.redirect("/auction/live?managerError=campi_mancanti", 303);
        try {
            await createManager({season: CURRENT_SEASON, name: body.name, budgetTotal});
            return reply.redirect(`/auction/live?managerAdded=${encodeURIComponent(body.name)}`, 303);
        } catch (error) {
            return reply.redirect(`/auction/live?managerError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/auction/live/picks", async function (request, reply) {
        const body = request.body || {};
        const managerId = Number(body.managerId);
        const playerId = Number(body.playerId);
        const price = Number(body.price);
        if (!Number.isFinite(managerId) || !Number.isFinite(playerId) || !Number.isFinite(price)) {
            return reply.redirect("/auction/live?pickError=campi_mancanti", 303);
        }
        try {
            await recordPick({season: CURRENT_SEASON, managerId, playerId, price});
            return reply.redirect("/auction/live?pickRecorded=1", 303);
        } catch (error) {
            return reply.redirect(`/auction/live?pickError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/auction/live/picks/:id/delete", async function (request, reply) {
        try {
            await deletePick(request.params.id);
            return reply.redirect("/auction/live?pickDeleted=1", 303);
        } catch (error) {
            return reply.redirect(`/auction/live?pickError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/auction/live/managers/:id/owner", async function (request, reply) {
        try {
            await setManagerOwner(CURRENT_SEASON, request.params.id);
            return reply.redirect("/auction/live?ownerSet=1", 303);
        } catch (error) {
            return reply.redirect(`/auction/live?managerError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/auction/live/turn/advance", async function (_request, reply) {
        try {
            await advanceTurn(CURRENT_SEASON);
            return reply.redirect("/auction/live?turnAdvanced=1", 303);
        } catch (error) {
            return reply.redirect(`/auction/live?pickError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/auction/live/reset", async function (_request, reply) {
        try {
            await resetAuction(CURRENT_SEASON);
            return reply.redirect("/auction/live?resetDone=1", 303);
        } catch (error) {
            return reply.redirect(`/auction/live?pickError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.get("/auction/live/export.xlsx", async function (_request, reply) {
        const buffer = await buildRosterWorkbook(CURRENT_SEASON);
        reply.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        reply.header("Content-Disposition", `attachment; filename="asta-${CURRENT_SEASON}.xlsx"`);
        return reply.send(buffer);
    });

    // The call screen (fischietto) and the "Cosa chiamo?" consultation view live ONLY in
    // the Live app now (routes/live.js's /live/call/:id and /live/suggest, Task F) — pure
    // gameplay, not session management. This file keeps only the JSON toggle (still needed
    // by the watchlist-builder below, which stays in Preparazione) and the watchlist page
    // itself.
    fastify.post("/auction/live/targets/:playerId/toggle", async function (request, reply) {
        return reply.send(await toggleTarget(CURRENT_SEASON, Number(request.params.playerId)));
    });

    fastify.get("/auction/live/watchlist", async function (request, reply) {
        return reply.view("auction-watchlist.handlebars", {title: "La mia lista", ...await buildWatchlistPage(), path: request.url}, MAIN_LAYOUT);
    });

    fastify.get("/players/data-health", async function (request, reply) {
        return reply.view("players-data-health.handlebars", {...await buildDataHealthView(), path: request.url}, MAIN_LAYOUT);
    });
    fastify.get("/players/:id", async function (request, reply) {
        const viewModel = await getPlayerPage(request.params.id);
        return reply.view("player.handlebars", {...viewModel, path: request.url}, MAIN_LAYOUT);
    });
};
