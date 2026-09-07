"use strict";
// The "Live" app (Task F): pure in-progress-auction gameplay, rendered under
// layouts/live.handlebars (minimal header, no full nav — "modalità focus"). Session
// management (managers, reset, export, manual pick correction) stays in Preparazione
// (routes/pages.js's /auction/live) — this file only ever composes the SAME underlying
// services Preparazione already uses; no business logic is duplicated here.
const buildAuctionLivePage = require("../../src/auction/services/auctionLivePage");
const buildAuctionCallPage = require("../../src/auction/services/auctionCallPage");
const evaluateLiveBid = require("../../src/auction/services/evaluateLiveBid");
const buildSuggestPage = require("../../src/auction/services/suggestPage");
const buildLiveRecap = require("../../src/auction/services/liveRecap");
const recordPick = require("../../src/auction/services/recordPick");
const advanceTurn = require("../../src/auction/services/advanceTurn");

const CURRENT_SEASON = "2026-27";
const LIVE_LAYOUT = {layout: "layouts/live.handlebars"};

module.exports = async function liveRoutes(fastify) {
    fastify.get("/live", async function (request, reply) {
        const query = request.query || {};
        return reply.view("live-home.handlebars", {
            title: "Asta live",
            ...await buildAuctionLivePage(),
            path: request.url,
            pickRecorded: query.pickRecorded,
            pickError: query.pickError,
            turnAdvanced: query.turnAdvanced
        }, LIVE_LAYOUT);
    });

    fastify.get("/live/call/:playerId", async function (request, reply) {
        return reply.view("live-call.handlebars", {title: "Giocatore in asta", ...await buildAuctionCallPage(request.params.playerId), path: request.url}, LIVE_LAYOUT);
    });
    fastify.get("/live/call/:playerId/evaluate", async function (request, reply) {
        const currentBid = Number(request.query && request.query.currentBid);
        if (!Number.isFinite(currentBid)) return reply.code(400).send({error: "currentBid_required"});
        return reply.send(await evaluateLiveBid({playerId: request.params.playerId, currentBid}));
    });

    fastify.post("/live/picks", async function (request, reply) {
        const body = request.body || {};
        const managerId = Number(body.managerId);
        const playerId = Number(body.playerId);
        const price = Number(body.price);
        if (!Number.isFinite(managerId) || !Number.isFinite(playerId) || !Number.isFinite(price)) {
            return reply.redirect("/live?pickError=campi_mancanti", 303);
        }
        try {
            await recordPick({season: CURRENT_SEASON, managerId, playerId, price});
            return reply.redirect("/live?pickRecorded=1", 303);
        } catch (error) {
            return reply.redirect(`/live?pickError=${encodeURIComponent(error.message)}`, 303);
        }
    });
    fastify.post("/live/turn/advance", async function (_request, reply) {
        try {
            await advanceTurn(CURRENT_SEASON);
            return reply.redirect("/live?turnAdvanced=1", 303);
        } catch (error) {
            return reply.redirect(`/live?pickError=${encodeURIComponent(error.message)}`, 303);
        }
    });

    fastify.get("/live/suggest", async function (request, reply) {
        return reply.view("live-suggest.handlebars", {title: "Cosa chiamo?", ...await buildSuggestPage(), path: request.url}, LIVE_LAYOUT);
    });
    fastify.get("/live/recap", async function (request, reply) {
        return reply.view("live-recap.handlebars", {title: "Andamento", ...await buildLiveRecap(), path: request.url}, LIVE_LAYOUT);
    });
};
