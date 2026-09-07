"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function removeTarget(season, playerId) {
    return backendApi({method: "DELETE", pathname: `/v1/auction/targets/${encodeURIComponent(playerId)}?season=${encodeURIComponent(season)}`});
};
