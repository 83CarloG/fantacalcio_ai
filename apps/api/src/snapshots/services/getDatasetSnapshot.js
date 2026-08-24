"use strict";
const getDatasetSnapshotJob = require("../jobs/getDatasetSnapshot");
module.exports = async function getDatasetSnapshot(id) { return getDatasetSnapshotJob(id); };
