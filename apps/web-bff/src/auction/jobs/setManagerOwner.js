"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function setManagerOwner(season, managerId) {
    return backendApi({method: "POST", pathname: `/v1/league/managers/${encodeURIComponent(managerId)}/owner`, body: {season}});
};
