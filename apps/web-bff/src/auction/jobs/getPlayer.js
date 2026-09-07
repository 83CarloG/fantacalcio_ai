"use strict";
const backendApi = require("../../drivers/backendApi");
module.exports = async function getPlayer(id) { return backendApi({pathname: `/v1/players/${encodeURIComponent(id)}`}); };
