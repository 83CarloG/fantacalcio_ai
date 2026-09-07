"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function getDataHealth() {
    return backendApi({method: "GET", pathname: "/v1/data-health"});
};
