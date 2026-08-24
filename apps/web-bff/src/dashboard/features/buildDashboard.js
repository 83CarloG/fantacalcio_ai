"use strict";
const getPlayers = require("../jobs/getPlayers");
const getMarketModel = require("../jobs/getMarketModel");
module.exports = async function buildDashboard() {
    const [players, marketModel] = await Promise.all([getPlayers(), getMarketModel()]);
    return {title: "Fanta Luminous", players, marketModel, playerCount: players.length};
};
