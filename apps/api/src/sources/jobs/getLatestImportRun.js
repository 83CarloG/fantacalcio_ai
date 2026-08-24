"use strict";
const database = require("../../drivers/database");

/**
 * The most recent run for one import type, or null if that import never ran.
 * `result` is parsed back from JSON so the caller never handles the storage shape.
 *
 * @param {string} importType e.g. "LISTONE"
 * @return {?{runId: number, importType: string, status: string, startedAt: string, finishedAt: ?string, result: ?object, error: ?string}}
 */
module.exports = async function getLatestImportRun(importType) {
    const row = database().prepare(`
        SELECT id, import_type, status, started_at, finished_at, result_json, error
        FROM source_import_runs
        WHERE import_type = ?
        ORDER BY id DESC
        LIMIT 1
    `).get(importType);
    if (!row) return null;
    return {
        runId: row.id,
        importType: row.import_type,
        status: row.status,
        startedAt: row.started_at,
        finishedAt: row.finished_at || null,
        result: row.result_json ? JSON.parse(row.result_json) : null,
        error: row.error || null
    };
};
