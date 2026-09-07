"use strict";
const backendApi = require("../../drivers/backendApi");

/** Ask the REST API for a bid/pass recommendation at the current live price — reused from the (now-removed) player-page evaluate form, this time driven by the live-auction call screen. */
module.exports = async function evaluateBid(payload) {
    return backendApi({method: "POST", pathname: "/v1/auction/evaluate", body: payload});
};
