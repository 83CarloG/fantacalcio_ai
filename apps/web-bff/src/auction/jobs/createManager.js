"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function createManager({season, name, budgetTotal}) {
    return backendApi({method: "POST", pathname: "/v1/league/managers", body: {season, name, budgetTotal}});
};
