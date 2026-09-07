"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function recordPick({season, managerId, playerId, price}) {
    return backendApi({method: "POST", pathname: "/v1/auction/picks", body: {season, managerId, playerId, price}});
};
