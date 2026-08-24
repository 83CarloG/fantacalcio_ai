"use strict";
const backendApi = require("../../drivers/backendApi");
module.exports = async function getIndicators(id) { return backendApi({pathname: `/v1/players/${encodeURIComponent(id)}/indicators`}); };
