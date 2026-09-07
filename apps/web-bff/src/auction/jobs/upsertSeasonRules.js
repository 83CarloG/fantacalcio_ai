"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function upsertSeasonRules(payload) {
    return backendApi({method: "POST", pathname: "/v1/league/season-rules", body: payload});
};
