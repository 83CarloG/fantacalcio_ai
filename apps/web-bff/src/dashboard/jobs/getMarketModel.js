"use strict";
const backendApi = require("../../drivers/backendApi");
module.exports = async function getMarketModel() { return backendApi({pathname: "/v1/market/model"}); };
