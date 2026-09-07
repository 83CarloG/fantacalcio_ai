"use strict";
const database = require("../../drivers/database");

/**
 * Wipe this season's IN-PROGRESS auction (picks + call-turn pointer) so a mock run can
 * restart from turn one. Deliberately does NOT touch `managers`/`season_rules` (league
 * setup) or `owner_targets` (the pre-auction watchlist) — those are preparation, not
 * progress, and re-entering them every test round is exactly what this button exists to
 * avoid.
 */
module.exports = async function resetAuctionProgress(season) {
    const db = database();
    const picksDeleted = db.prepare("DELETE FROM live_auction_picks WHERE season = ?").run(season).changes;
    db.prepare("DELETE FROM auction_turn WHERE season = ?").run(season);
    return {picksDeleted};
};
