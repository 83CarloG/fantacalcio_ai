"use strict";
const backendApi = require("../../drivers/backendApi");

/** Create an immutable dataset snapshot (POST_MARKET_BASELINE or AUCTION_SNAPSHOT). */
module.exports = async function createDatasetSnapshot(type) {
    return backendApi({method: "POST", pathname: "/v1/snapshots", body: {type}});
};
