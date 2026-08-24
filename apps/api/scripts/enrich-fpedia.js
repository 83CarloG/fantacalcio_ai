"use strict";
// CLI twin of `POST /v1/sources/fpedia/enrich` — same services either way (Luminous "service
// isolation"). Unlike the HTTP route this simply awaits to completion, which is what a
// human running the initial full enrichment from a terminal actually wants.
const enrichFpedia = require("../src/sources/services/enrichFpedia");
const recalculateIndicators = require("../src/indicators/services/recalculateIndicators");

const mode = process.argv[2] || "full";
const run = {full: enrichFpedia.full, stale: enrichFpedia.stale, "retry-failed": enrichFpedia.retryFailed, force: enrichFpedia.force}[mode];
if (!run) {
    console.error(`Unknown mode "${mode}". Use one of: full, stale, retry-failed, force`);
    process.exit(1);
}

run().then(async function (result) {
    console.log(JSON.stringify(result, null, 2));
    console.log("Recalculating indicators for all active players...");
    console.log(JSON.stringify(await recalculateIndicators.all(), null, 2));
}).catch(function (error) {
    console.error("FPEDIA enrichment failed:", error.message);
    process.exitCode = 1;
});
