"use strict";
const backendApi = require("../../drivers/backendApi");

/** Trigger the API's bulk Fantacalcio.it listone import. */
module.exports = async function importListone() {
    return backendApi({method: "POST", pathname: "/v1/sources/fantacalcio/listone"});
};
