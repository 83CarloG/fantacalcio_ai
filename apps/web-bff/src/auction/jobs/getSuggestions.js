"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function getSuggestions(season) {
    return backendApi({method: "GET", pathname: `/v1/auction/suggestions?season=${encodeURIComponent(season)}`});
};
