"use strict";
const path = require("node:path");
module.exports = {
    playerSnapshot: path.join(__dirname, "schemas", "player-snapshot.schema.json"),
    playerIndicators: path.join(__dirname, "schemas", "player-indicators.schema.json"),
    marketModel: path.join(__dirname, "schemas", "league-market-model.schema.json"),
    auctionTransactions: path.join(__dirname, "schemas", "auction-transactions.schema.json")
};
