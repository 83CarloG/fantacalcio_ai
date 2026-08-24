"use strict";
const backendApi = require("../../drivers/backendApi");

/** Trigger the API's FPEDIA enrichment batch (fire-and-forget on the API side). */
module.exports = async function enrichFpedia(mode) {
    return backendApi({method: "POST", pathname: "/v1/sources/fpedia/enrich", body: {mode}});
};
