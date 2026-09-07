"use strict";
const database = require("../../drivers/database");

/**
 * Close out a run row opened by startImportRun. `result` is stored as JSON for a SUCCESS,
 * `error` as a plain message for a FAILED run; a run is only ever closed once.
 *
 * @param {{runId: number, status: "SUCCESS"|"FAILED", result?: object, error?: string}} params
 */
module.exports = async function finishImportRun({runId, status, result = null, error = null}) {
    database().prepare(`
        UPDATE source_import_runs
        SET status = ?, finished_at = ?, result_json = ?, error = ?
        WHERE id = ? AND status = 'RUNNING'
    `).run(status, new Date().toISOString(), result === null ? null : JSON.stringify(result), error, runId);
};
