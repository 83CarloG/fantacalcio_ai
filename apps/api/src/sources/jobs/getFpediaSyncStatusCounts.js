"use strict";
const database = require("../../drivers/database");

/**
 * How many ACTIVE players' FPEDIA identity mapping sit in each sync status, for the admin
 * status view — plus `IDENTIFIED`, the count of ACTIVE players FPEDIA has ever been matched
 * to at all. That distinction matters: a player Fantacalcio.it's listone knows about but that
 * has no `player_source_identities` row for FPEDIA (a backup/youth player FPEDIA's own index
 * never covered) is not "pending enrichment" — no enrichment batch can ever reach them, since
 * `listFpediaSyncCandidates` only selects players with a resolved FPEDIA URL. Without
 * `IDENTIFIED` as a distinct number, a caller has no way to tell "still queued" apart from
 * "structurally unreachable", and a progress bar built only from SUCCESS/FAILED/etc. counts
 * looks stuck forever once every identified player is done.
 */
module.exports = async function getFpediaSyncStatusCounts() {
    const db = database();
    const rows = db.prepare(`
        SELECT s.status AS status, COUNT(*) AS count
        FROM player_source_sync_state s
        JOIN players p ON p.player_id = s.player_id
        WHERE s.source = 'fpedia' AND p.status = 'ACTIVE'
        GROUP BY s.status
    `).all();
    const counts = rows.reduce(function (acc, row) { acc[row.status] = row.count; return acc; }, {});
    counts.IDENTIFIED = db.prepare(`
        SELECT COUNT(*) AS count
        FROM players p
        JOIN player_source_identities i ON i.player_id = p.player_id AND i.source = 'fpedia'
        WHERE p.status = 'ACTIVE'
    `).get().count;
    return counts;
};
