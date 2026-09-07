"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function addTarget(season, playerId) {
    return backendApi({method: "POST", pathname: "/v1/auction/targets", body: {season, playerId}});
};
