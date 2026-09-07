"use strict";
const database = require("../../drivers/database");

/** Persist the call-turn pointer — one row per season, upserted (see db/006_league_config_and_turn.sql). */
module.exports = async function setCurrentCaller(season, managerId) {
    database().prepare(`
        INSERT INTO auction_turn(season, current_caller_manager_id) VALUES (?, ?)
        ON CONFLICT(season) DO UPDATE SET current_caller_manager_id = excluded.current_caller_manager_id
    `).run(season, managerId);
};
