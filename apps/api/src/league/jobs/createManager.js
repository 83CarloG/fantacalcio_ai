"use strict";
const database = require("../../drivers/database");

/**
 * Add one manager to a season's league. `UNIQUE(season, name)` in the schema rejects a
 * duplicate name for the same season rather than silently creating a second entry.
 * `call_order` defaults to "next free slot" (max + 1) — the fixed calling order the
 * operator sets by the order they add managers before the auction starts; it can still be
 * edited afterwards via jobs/setManagerCallOrder.js if they need to reorder.
 *
 * @param {{season:string, name:string, budgetTotal:number}} input
 */
module.exports = async function createManager({season, name, budgetTotal}) {
    const db = database();
    const now = new Date().toISOString();
    const {maxOrder} = db.prepare("SELECT MAX(call_order) AS maxOrder FROM managers WHERE season = ?").get(season);
    const callOrder = (maxOrder ?? 0) + 1;
    const result = db.prepare(`
        INSERT INTO managers(season, name, budget_total, call_order, created_at) VALUES (?, ?, ?, ?, ?)
    `).run(season, name, budgetTotal, callOrder, now);
    return {id: Number(result.lastInsertRowid), season, name, budgetTotal, callOrder, isOwner: false, createdAt: now};
};
