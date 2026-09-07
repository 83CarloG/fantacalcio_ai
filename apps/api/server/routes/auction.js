"use strict";
const evaluateBid = require("../../src/auction/services/evaluateBid");
const buildAuctionState = require("../../src/auction/services/buildAuctionState");
const recordAuctionPick = require("../../src/auction/services/recordAuctionPick");
const deleteAuctionPick = require("../../src/auction/services/deleteAuctionPick");
const advanceAuctionTurn = require("../../src/auction/services/advanceAuctionTurn");
const nominationSuggestions = require("../../src/auction/services/nominationSuggestions");
const addOwnerTarget = require("../../src/auction/services/addOwnerTarget");
const removeOwnerTarget = require("../../src/auction/services/removeOwnerTarget");
const listOwnerTargetIds = require("../../src/auction/services/listOwnerTargetIds");
const resetAuctionProgress = require("../../src/auction/services/resetAuctionProgress");

module.exports = async function auctionRoutes(fastify) {
    fastify.post("/v1/auction/evaluate", async function (request, reply) { return reply.send({data: await evaluateBid(request.body || {})}); });

    fastify.get("/v1/auction/state", async function (request, reply) {
        const season = request.query && request.query.season;
        if (!season) return reply.code(400).send({error: "season_required"});
        return reply.send({data: await buildAuctionState(season)});
    });
    fastify.post("/v1/auction/picks", async function (request, reply) {
        const body = request.body || {};
        const managerId = Number(body.managerId);
        const playerId = Number(body.playerId);
        const price = Number(body.price);
        if (!body.season || !Number.isFinite(managerId) || !Number.isFinite(playerId) || !Number.isFinite(price)) {
            return reply.code(400).send({error: "season_managerId_playerId_and_price_required"});
        }
        try {
            const data = await recordAuctionPick({season: body.season, managerId, playerId, price});
            // a recorded pick closes that call — the route composes the two services
            // (Luminous forbids a service calling another service), same pattern as
            // enrichFpedia -> recalculateIndicators in routes/sources.js
            await advanceAuctionTurn(body.season);
            return reply.code(201).send({data});
        } catch (error) {
            if (/UNIQUE constraint failed/.test(error.message)) return reply.code(409).send({error: "player_already_picked"});
            if (/FOREIGN KEY constraint failed/.test(error.message)) return reply.code(400).send({error: "unknown_manager_or_player"});
            throw error;
        }
    });
    fastify.delete("/v1/auction/picks/:id", async function (request, reply) {
        const data = await deleteAuctionPick(Number(request.params.id));
        if (!data.deleted) return reply.code(404).send({error: "pick_not_found"});
        return reply.send({data});
    });
    fastify.post("/v1/auction/turn/advance", async function (request, reply) {
        const season = request.body && request.body.season;
        if (!season) return reply.code(400).send({error: "season_required"});
        return reply.send({data: await advanceAuctionTurn(season)});
    });
    fastify.post("/v1/auction/reset", async function (request, reply) {
        const season = request.body && request.body.season;
        if (!season) return reply.code(400).send({error: "season_required"});
        return reply.send({data: await resetAuctionProgress(season)});
    });

    fastify.get("/v1/auction/suggestions", async function (request, reply) {
        const season = request.query && request.query.season;
        if (!season) return reply.code(400).send({error: "season_required"});
        return reply.send({data: await nominationSuggestions(season)});
    });
    fastify.get("/v1/auction/targets", async function (request, reply) {
        const season = request.query && request.query.season;
        if (!season) return reply.code(400).send({error: "season_required"});
        return reply.send({data: await listOwnerTargetIds(season)});
    });
    fastify.post("/v1/auction/targets", async function (request, reply) {
        const body = request.body || {};
        const playerId = Number(body.playerId);
        if (!body.season || !Number.isFinite(playerId)) return reply.code(400).send({error: "season_and_playerId_required"});
        return reply.code(201).send({data: await addOwnerTarget(body.season, playerId)});
    });
    fastify.delete("/v1/auction/targets/:playerId", async function (request, reply) {
        const season = request.query && request.query.season;
        if (!season) return reply.code(400).send({error: "season_required"});
        const data = await removeOwnerTarget(season, Number(request.params.playerId));
        if (!data.removed) return reply.code(404).send({error: "target_not_found"});
        return reply.send({data});
    });
};
