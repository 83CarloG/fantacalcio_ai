"use strict";
const database = require("../../drivers/database");

/** Undo one recorded pick — a real correction path for a mis-entered price/manager/player during a live auction, never a silent overwrite. */
module.exports = async function deleteAuctionPick(id) {
    const result = database().prepare("DELETE FROM live_auction_picks WHERE id = ?").run(id);
    return {deleted: result.changes > 0};
};
