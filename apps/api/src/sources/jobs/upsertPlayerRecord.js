"use strict";
const database = require("../../drivers/database");

/**
 * Insert or update one player's identity + current listone pricing. Uses a real UPDATE
 * on conflict (never a delete+reinsert like `INSERT OR REPLACE`) so it never trips the
 * `player_snapshots.player_id` foreign key when a listone row overlaps a player that
 * already has snapshot history.
 *
 * `display_name` mirrors the abbreviated name exactly as the Listone gives it (e.g.
 * "Paz N."); `name` is left with the same historical meaning existing callers rely on.
 * `full_name`/`normalized_name` are NOT touched here — they are only ever set by identity
 * reconciliation (see features/reconcilePlayerIdentity.js), so a re-import never wipes out
 * an already-resolved full name. Presence in the listone always means eligible again, so
 * `status` is unconditionally reset to ACTIVE (see jobs/markPlayersRemoved.js for the
 * opposite direction).
 */
module.exports = async function upsertPlayerRecord(player) {
    const db = database();
    const now = new Date().toISOString();
    db.prepare(`
        INSERT INTO players(player_id, name, team, role, quotation_classic, fvm_classic, quotation_mantra, fvm_mantra, display_name, status, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
        ON CONFLICT(player_id) DO UPDATE SET
            name = excluded.name,
            team = excluded.team,
            role = excluded.role,
            quotation_classic = excluded.quotation_classic,
            fvm_classic = excluded.fvm_classic,
            quotation_mantra = excluded.quotation_mantra,
            fvm_mantra = excluded.fvm_mantra,
            display_name = excluded.display_name,
            status = 'ACTIVE',
            last_seen_at = excluded.last_seen_at
    `).run(
        player.fantacalcioPlayerId,
        player.name,
        player.team,
        player.role,
        player.quotationClassic,
        player.fvmClassic,
        player.quotationMantra,
        player.fvmMantra,
        player.name,
        now
    );
};
