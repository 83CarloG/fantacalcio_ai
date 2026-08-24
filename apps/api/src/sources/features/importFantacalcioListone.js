"use strict";
const collectFantacalcioListone = require("../operations/collectFantacalcioListone");
const upsertPlayerRecord = require("../jobs/upsertPlayerRecord");
const recordPlayerSnapshot = require("../jobs/recordPlayerSnapshot");
const markPlayersRemoved = require("../jobs/markPlayersRemoved");

/**
 * Pull the current Fantacalcio.it listone and persist every player's identity + pricing.
 * Also records a PLAYER snapshot per player for this import, and flips any previously-ACTIVE
 * player missing from this import to REMOVED (never deleted — see markPlayersRemoved).
 * Returns the parsed players too, so a caller (see services/importFantacalcioListone.js) can
 * run identity reconciliation against FPEDIA without re-fetching/re-parsing the listone.
 */
module.exports = async function importFantacalcioListone(url) {
    const players = await collectFantacalcioListone(url);
    for (const player of players) {
        await upsertPlayerRecord(player);
        await recordPlayerSnapshot({playerId: player.fantacalcioPlayerId, snapshotType: "LISTONE_IMPORT", payload: player});
    }
    const removed = await markPlayersRemoved(players.map((player) => player.fantacalcioPlayerId));
    return {imported: players.length, removed, source: "fantacalcio.it", importedAt: new Date().toISOString(), players};
};
