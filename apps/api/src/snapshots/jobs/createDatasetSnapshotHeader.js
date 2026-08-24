"use strict";
const database = require("../../drivers/database");

/**
 * Insert the immutable header row for a named dataset snapshot (POST_MARKET_BASELINE,
 * AUCTION_SNAPSHOT, or a manual one). Creation IS the lock: there is no separate "publish"
 * step, and nothing in this codebase ever UPDATEs a dataset_snapshots row after insert.
 *
 * @return {number} the new dataset_snapshots.id
 */
module.exports = async function createDatasetSnapshotHeader({label, snapshotType, algorithmVersion, matchdaysIncluded = 0, notes = null}) {
    const now = new Date().toISOString();
    const result = database().prepare(`
        INSERT INTO dataset_snapshots(label, snapshot_type, algorithm_version, matchdays_included, created_at, locked_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(label, snapshotType, algorithmVersion, matchdaysIncluded, now, now, notes);
    return Number(result.lastInsertRowid);
};
