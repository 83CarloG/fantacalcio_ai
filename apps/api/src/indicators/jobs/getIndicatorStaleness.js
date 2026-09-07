"use strict";
const database = require("../../drivers/database");

const BUCKETS = [
    {key: "under24h", label: "<24h", maxHours: 24},
    {key: "d1to3", label: "1-3d", maxHours: 72},
    {key: "d3to7", label: "3-7d", maxHours: 168},
    {key: "d7to14", label: "7-14d", maxHours: 336},
    {key: "over14d", label: ">14d", maxHours: Infinity}
];
const MOST_STALE_LIMIT = 10;

function bucketFor(ageHours) {
    return BUCKETS.find((bucket) => ageHours <= bucket.maxHours) || BUCKETS[BUCKETS.length - 1];
}

/**
 * How old each ACTIVE player's most recent indicator snapshot is, for the data-health page.
 * A player who was never computed has no `indicator_snapshots` row at all (LEFT JOIN keeps
 * them visible instead of silently dropping them) and is reported separately as
 * `neverComputed` rather than folded into the oldest age bucket — "never" and "14 days ago"
 * are different facts, not the same failure at different severities.
 */
module.exports = async function getIndicatorStaleness() {
    const db = database();
    const now = Date.now();
    const rows = db.prepare(`
        SELECT p.player_id AS playerId, p.name, p.team, p.role, latest.computed_at AS computedAt
        FROM players p
        LEFT JOIN (
            SELECT player_id, MAX(computed_at) AS computed_at
            FROM indicator_snapshots
            GROUP BY player_id
        ) latest ON latest.player_id = p.player_id
        WHERE p.status = 'ACTIVE'
    `).all();

    const buckets = Object.fromEntries(BUCKETS.map((bucket) => [bucket.key, 0]));
    let neverComputed = 0;
    const withAge = [];

    for (const row of rows) {
        if (!row.computedAt) { neverComputed += 1; continue; }
        const ageHours = (now - Date.parse(row.computedAt)) / 3_600_000;
        buckets[bucketFor(ageHours).key] += 1;
        withAge.push({...row, ageHours});
    }

    withAge.sort((a, b) => b.ageHours - a.ageHours);

    return {
        total: rows.length,
        withIndicators: withAge.length,
        neverComputed,
        buckets: BUCKETS.map((bucket) => ({key: bucket.key, label: bucket.label, count: buckets[bucket.key]})),
        mostStale: withAge.slice(0, MOST_STALE_LIMIT).map((row) => ({
            playerId: row.playerId,
            name: row.name,
            team: row.team,
            role: row.role,
            computedAt: row.computedAt,
            ageHours: Math.round(row.ageHours)
        }))
    };
};
