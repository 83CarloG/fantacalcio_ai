"use strict";
const backendApi = require("../../drivers/backendApi");

/** Latest Fantacalcio.it listone import run, for the dashboard setup checklist. */
module.exports = async function getListoneStatus() {
    return backendApi({method: "GET", pathname: "/v1/sources/fantacalcio/listone/status"});
};
