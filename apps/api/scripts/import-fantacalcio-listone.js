"use strict";
// CLI twin of `POST /v1/sources/fantacalcio/listone` — the service works unchanged from
// either caller, per the Luminous "service isolation" check (docs/reference/LUMINOUS_ARCHITECTURE.md).
// The CLI calls `run` (blocks until done) rather than `start` (returns immediately for HTTP
// callers): a shell invocation has no response deadline and wants the full result printed.
const importFantacalcioListone = require("../src/sources/services/importFantacalcioListone");

importFantacalcioListone.run(process.argv[2]).then(function (result) {
    console.log(JSON.stringify(result, null, 2));
}).catch(function (error) {
    console.error("Listone import failed:", error.message);
    process.exitCode = 1;
});
