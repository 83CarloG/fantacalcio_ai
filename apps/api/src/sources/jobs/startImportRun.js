"use strict";
const database = require("../../drivers/database");

/**
 * Open a RUNNING row for one source import attempt and return its id.
 * The row is written before any work starts, so a process that dies mid-import leaves a
 * visible RUNNING row rather than silently no trace at all.
 *
 * @param {string} importType e.g. "LISTONE"
 * @return {number} the new run id
 */
module.exports = async function startImportRun(importType) {
    const result = database().prepare(`
        INSERT INTO source_import_runs(import_type, status, started_at)
        VALUES (?, 'RUNNING', ?)
    `).run(importType, new Date().toISOString());
    return Number(result.lastInsertRowid);
};
