"use strict";
const listDatasetSnapshotsJob = require("../jobs/listDatasetSnapshots");
module.exports = async function listDatasetSnapshots() { return listDatasetSnapshotsJob(); };
