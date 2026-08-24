"use strict";
const database = require("../../drivers/database");
module.exports = async function getMarketModel() {
    const row = database().prepare("SELECT payload_json FROM market_models ORDER BY created_at DESC LIMIT 1").get();
    return row ? JSON.parse(row.payload_json) : null;
};
