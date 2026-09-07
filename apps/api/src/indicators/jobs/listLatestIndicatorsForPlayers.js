"use strict";
const database = require("../../drivers/database");

/**
 * The latest indicator snapshot for every ACTIVE player that has one, trimmed to just the
 * fields the nomination-suggestion engine needs (VORP/tier/scarcity/expected price) — for
 * ~500 players, asking `getPlayerIndicators` one at a time (the per-player read path) would
 * be far too slow for a live auction; one query instead.
 *
 * @return {Array<{playerId:number, technicalProjectionScore:?number, riskScore:?number, vorp:?number, tier:?number, scarcityIndex:?number, expectedPrice:?number}>}
 */
module.exports = async function listLatestIndicatorsForPlayers() {
    const rows = database().prepare(`
        SELECT i.player_id AS playerId, i.payload_json AS payloadJson
        FROM indicator_snapshots i
        JOIN (
            SELECT player_id, MAX(computed_at) AS maxComputedAt
            FROM indicator_snapshots
            GROUP BY player_id
        ) latest ON latest.player_id = i.player_id AND latest.maxComputedAt = i.computed_at
        JOIN players p ON p.player_id = i.player_id
        WHERE p.status = 'ACTIVE'
    `).all();

    return rows.map((row) => {
        const payload = JSON.parse(row.payloadJson);
        return {
            playerId: row.playerId,
            technicalProjectionScore: payload.technical ? payload.technical.technicalProjectionScore : null,
            riskScore: payload.technical ? payload.technical.riskScore : null,
            vorp: payload.relativeValue ? payload.relativeValue.vorp : null,
            tier: payload.relativeValue ? payload.relativeValue.tier : null,
            scarcityIndex: payload.relativeValue ? payload.relativeValue.scarcityIndex : null,
            expectedPrice: payload.market ? payload.market.expectedPrice : null
        };
    });
};
