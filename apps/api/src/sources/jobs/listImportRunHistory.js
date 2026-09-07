"use strict";
const database = require("../../drivers/database");

/**
 * The last `limit` runs per `import_type`, for the data-health page — `getLatestImportRun`
 * only ever answers "the latest one", which isn't enough for a history view. One query
 * (a window function, not `limit` separate per-type queries) so this stays correct however
 * many distinct `import_type` values `source_import_runs` grows to hold.
 *
 * Today only the LISTONE listone import writes to `source_import_runs` (see
 * apps/api/src/sources/services/importFantacalcioListone.js) — FPEDIA enrichment and
 * season-stats import don't use this ledger yet — so the result will only ever have a
 * `LISTONE` key until that changes; this job makes no assumption about which types exist.
 *
 * @param {{limit?: number}} [options]
 * @return {{byType: Object<string, Array<{runId:number, status:string, startedAt:string, finishedAt:?string, error:?string}>>}}
 */
module.exports = async function listImportRunHistory({limit = 10} = {}) {
    const rows = database().prepare(`
        SELECT id, import_type, status, started_at, finished_at, error FROM (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY import_type ORDER BY id DESC) AS rn
            FROM source_import_runs
        )
        WHERE rn <= ?
        ORDER BY import_type, id DESC
    `).all(limit);

    const byType = {};
    for (const row of rows) {
        const entry = {
            runId: row.id,
            status: row.status,
            startedAt: row.started_at,
            finishedAt: row.finished_at || null,
            error: row.error || null
        };
        (byType[row.import_type] ||= []).push(entry);
    }
    return {byType};
};
