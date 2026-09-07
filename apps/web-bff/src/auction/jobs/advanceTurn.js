"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function advanceTurn(season) {
    return backendApi({method: "POST", pathname: "/v1/auction/turn/advance", body: {season}});
};
