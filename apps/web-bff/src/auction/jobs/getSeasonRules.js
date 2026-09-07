"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function getSeasonRules(season) {
    return backendApi({method: "GET", pathname: `/v1/league/season-rules?season=${encodeURIComponent(season)}`});
};
