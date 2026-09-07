"use strict";
const database = require("../../drivers/database");

/**
 * Record one real winning bid from the live auction. `manager_id`/`player_id` are enforced
 * by the schema's FK constraints (`PRAGMA foreign_keys = ON`, drivers/database.js) — an
 * unknown manager or player throws here rather than silently recording orphaned data; the
 * route layer turns that into a clean 400. `UNIQUE(season, player_id)` throws the same way
 * on a duplicate — corrections go through jobs/deleteAuctionPick.js and a fresh insert,
 * never a silent overwrite.
 *
 * @param {{season:string, managerId:number, playerId:number, price:number}} input
 */
module.exports = async function recordAuctionPick({season, managerId, playerId, price}) {
    const now = new Date().toISOString();
    const result = database().prepare(`
        INSERT INTO live_auction_picks(season, manager_id, player_id, price, recorded_at) VALUES (?, ?, ?, ?, ?)
    `).run(season, managerId, playerId, price, now);
    return {id: Number(result.lastInsertRowid), season, managerId, playerId, price, recordedAt: now};
};
