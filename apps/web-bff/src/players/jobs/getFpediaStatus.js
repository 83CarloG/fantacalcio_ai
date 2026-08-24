"use strict";
const backendApi = require("../../drivers/backendApi");

/** Current FPEDIA enrichment status counts (pending/success/failed/needs-review), for the admin panel. */
module.exports = async function getFpediaStatus() {
    return backendApi({method: "GET", pathname: "/v1/sources/fpedia/status"});
};
