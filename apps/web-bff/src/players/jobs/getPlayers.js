"use strict";
const backendApi = require("../../drivers/backendApi");
module.exports = async function getPlayers(role) { return backendApi({pathname: `/v1/players${role ? `?role=${encodeURIComponent(role)}` : ""}`}); };
