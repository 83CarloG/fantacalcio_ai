"use strict";
const backendApi = require("../../drivers/backendApi");

/** Ask the REST API to evaluate an in-progress auction bid for a player. */
module.exports = async function evaluateBid(payload) {
    return backendApi({method: "POST", pathname: "/v1/auction/evaluate", body: payload});
};
