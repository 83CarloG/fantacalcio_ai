"use strict";
const backendApi = require("../../drivers/backendApi");

/** Latest Fantacalcio.it listone import run (status/started/finished/result), for the admin panel. */
module.exports = async function getListoneStatus() {
    return backendApi({method: "GET", pathname: "/v1/sources/fantacalcio/listone/status"});
};
