"use strict";
// CLI twin of `POST /v1/snapshots`. Usage: node scripts/create-dataset-snapshot.js <TYPE> [label]
// TYPE is one of POST_MARKET_BASELINE, AUCTION_SNAPSHOT, MANUAL.
const createDatasetSnapshot = require("../src/snapshots/services/createDatasetSnapshot");
const recalculateIndicators = require("../src/indicators/services/recalculateIndicators");

const VALID_TYPES = new Set(["POST_MARKET_BASELINE", "AUCTION_SNAPSHOT", "MANUAL"]);
const type = process.argv[2];
const label = process.argv[3];

if (!VALID_TYPES.has(type)) {
    console.error(`Usage: node scripts/create-dataset-snapshot.js <${[...VALID_TYPES].join("|")}> [label]`);
    process.exit(1);
}

createDatasetSnapshot({type, label}).then(async function (created) {
    console.log(JSON.stringify(created, null, 2));
    console.log("Recalculating + pinning indicators...");
    console.log(JSON.stringify(await recalculateIndicators.all(created.datasetSnapshotId), null, 2));
}).catch(function (error) {
    console.error("Dataset snapshot creation failed:", error.message);
    process.exitCode = 1;
});
