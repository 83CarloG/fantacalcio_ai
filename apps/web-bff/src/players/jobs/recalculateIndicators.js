"use strict";
const backendApi = require("../../drivers/backendApi");

/** Trigger a full indicator recalculation for every active player. */
module.exports = async function recalculateIndicators() {
    return backendApi({method: "POST", pathname: "/v1/indicators/recalculate"});
};
