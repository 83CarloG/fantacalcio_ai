"use strict";
const fetchHtml = require("../jobs/fetchFantacalcioHtml");
const parseSeasonStats = require("../jobs/parseFantacalcioSeasonStats");

const DEFAULT_STATS_URL = "https://www.fantacalcio.it/statistiche-serie-a";

/** Fetch + parse the bulk season-statistics page — one request for all ~500 players. */
module.exports = async function collectFantacalcioSeasonStats(url) {
    const response = await fetchHtml(url || DEFAULT_STATS_URL);
    return parseSeasonStats(response.text);
};
