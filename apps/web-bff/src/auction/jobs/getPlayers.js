"use strict";
const backendApi = require("../../drivers/backendApi");
module.exports = async function getPlayers() { return backendApi({pathname: "/v1/players"}); };
