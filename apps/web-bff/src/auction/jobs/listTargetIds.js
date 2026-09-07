"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function listTargetIds(season) {
    return backendApi({method: "GET", pathname: `/v1/auction/targets?season=${encodeURIComponent(season)}`});
};
