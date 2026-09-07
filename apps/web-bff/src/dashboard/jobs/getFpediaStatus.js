"use strict";
const backendApi = require("../../drivers/backendApi");

/** Current FPEDIA enrichment status counts, for the dashboard setup checklist. */
module.exports = async function getFpediaStatus() {
    return backendApi({method: "GET", pathname: "/v1/sources/fpedia/status"});
};
