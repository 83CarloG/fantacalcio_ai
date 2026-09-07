"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function getAuctionState(season) {
    return backendApi({method: "GET", pathname: `/v1/auction/state?season=${encodeURIComponent(season)}`});
};
