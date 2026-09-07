"use strict";
const createManager = require("../../src/league/services/createManager");
const listManagers = require("../../src/league/services/listManagers");
const setManagerOwner = require("../../src/league/services/setManagerOwner");
const setManagerCallOrder = require("../../src/league/services/setManagerCallOrder");
const getSeasonRules = require("../../src/league/services/getSeasonRules");
const upsertSeasonRules = require("../../src/league/services/upsertSeasonRules");

module.exports = async function leagueRoutes(fastify) {
    fastify.get("/v1/league/managers", async function (request, reply) {
        const season = request.query && request.query.season;
        if (!season) return reply.code(400).send({error: "season_required"});
        return reply.send({data: await listManagers(season)});
    });
    fastify.post("/v1/league/managers", async function (request, reply) {
        const body = request.body || {};
        if (!body.season || !body.name || !Number.isFinite(Number(body.budgetTotal))) {
            return reply.code(400).send({error: "season_name_and_budgetTotal_required"});
        }
        try {
            const data = await createManager({season: body.season, name: body.name, budgetTotal: Number(body.budgetTotal)});
            return reply.code(201).send({data});
        } catch (error) {
            if (/UNIQUE constraint failed/.test(error.message)) return reply.code(409).send({error: "manager_already_exists"});
            throw error;
        }
    });
    fastify.post("/v1/league/managers/:id/owner", async function (request, reply) {
        const body = request.body || {};
        if (!body.season) return reply.code(400).send({error: "season_required"});
        const data = await setManagerOwner(body.season, Number(request.params.id));
        if (!data.updated) return reply.code(404).send({error: "manager_not_found"});
        return reply.send({data});
    });
    fastify.post("/v1/league/managers/:id/call-order", async function (request, reply) {
        const body = request.body || {};
        const callOrder = Number(body.callOrder);
        if (!body.season || !Number.isFinite(callOrder)) return reply.code(400).send({error: "season_and_callOrder_required"});
        const data = await setManagerCallOrder(body.season, Number(request.params.id), callOrder);
        if (!data.updated) return reply.code(404).send({error: "manager_not_found"});
        return reply.send({data});
    });

    fastify.get("/v1/league/season-rules", async function (request, reply) {
        const season = request.query && request.query.season;
        if (!season) return reply.code(400).send({error: "season_required"});
        return reply.send({data: await getSeasonRules(season)});
    });
    fastify.post("/v1/league/season-rules", async function (request, reply) {
        const body = request.body || {};
        const participants = Number(body.participants);
        const budgetPerManager = Number(body.budgetPerManager);
        const rosterSlots = body.rosterSlots;
        if (!body.season || !Number.isFinite(participants) || !Number.isFinite(budgetPerManager) || !rosterSlots) {
            return reply.code(400).send({error: "season_participants_budgetPerManager_and_rosterSlots_required"});
        }
        const data = await upsertSeasonRules({season: body.season, participants, budgetPerManager, rosterSlots});
        return reply.send({data});
    });
};
