"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function resetAuction(season) {
    return backendApi({method: "POST", pathname: "/v1/auction/reset", body: {season}});
};
