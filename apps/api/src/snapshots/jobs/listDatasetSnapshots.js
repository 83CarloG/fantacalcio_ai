"use strict";
const database = require("../../drivers/database");

/** All dataset snapshots, newest first — for admin visibility / picking one to inspect. */
module.exports = async function listDatasetSnapshots() {
    return database().prepare(`
        SELECT id, label, snapshot_type, algorithm_version, matchdays_included, created_at, locked_at, notes
        FROM dataset_snapshots ORDER BY created_at DESC
    `).all();
};
