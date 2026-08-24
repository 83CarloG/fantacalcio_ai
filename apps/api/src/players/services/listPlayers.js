"use strict";
const listPlayersJob = require("../jobs/listPlayers");
module.exports = async function listPlayers(payload = {}) { return listPlayersJob({role: payload.role}); };
