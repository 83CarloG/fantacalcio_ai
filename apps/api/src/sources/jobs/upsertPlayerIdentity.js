"use strict";
const database = require("../../drivers/database");
const normalizePlayerName = require("../../shared/normalizePlayerName");

/**
 * Persist a resolved cross-source identity for one player. Manual overrides always win:
 * - a source mapping already pinned via `match_method = 'manual_override'` is never
 *   replaced by an automatic match for that same source;
 * - if ANY source has a manual override for this player, the displayed `full_name` is
 *   assumed to have been set deliberately too, and is left untouched by automatic matches.
 *
 * @param {{playerId:number, source:string, sourceId:?string, sourceUrl:?string, rawName:?string,
 *   fullName:?string, matchMethod?:string}} identity
 */
module.exports = async function upsertPlayerIdentity({
    playerId, source, sourceId, sourceUrl, rawName, fullName, matchMethod = "deterministic"
}) {
    const db = database();

    const existingSource = db.prepare(`
        SELECT match_method FROM player_source_identities WHERE player_id = ? AND source = ?
    `).get(playerId, source);
    const sourceIsOverridden = existingSource && existingSource.match_method === "manual_override" && matchMethod !== "manual_override";

    if (!sourceIsOverridden) {
        db.prepare(`
            INSERT INTO player_source_identities(player_id, source, source_id, source_url, raw_name, match_method, matched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(player_id, source) DO UPDATE SET
                source_id = excluded.source_id,
                source_url = excluded.source_url,
                raw_name = excluded.raw_name,
                match_method = excluded.match_method,
                matched_at = excluded.matched_at
        `).run(playerId, source, sourceId != null ? String(sourceId) : null, sourceUrl || null, rawName || null, matchMethod, new Date().toISOString());
    }

    if (!fullName || matchMethod !== "manual_override") {
        const anyOverride = db.prepare(`
            SELECT 1 FROM player_source_identities WHERE player_id = ? AND match_method = 'manual_override'
        `).get(playerId);
        if (anyOverride) return; // a human already decided this player's identity
    }

    if (fullName) {
        db.prepare(`
            UPDATE players SET full_name = ?, normalized_name = ? WHERE player_id = ?
        `).run(fullName, normalizePlayerName(fullName), playerId);
    }
};
