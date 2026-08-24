"use strict";
const fetchHtml = require("../jobs/fetchFantacalcioHtml");
const parseListone = require("../jobs/parseFantacalcioListone");

const DEFAULT_LISTONE_URL = "https://www.fantacalcio.it/quotazioni-fantacalcio";

/** Fetch + parse the full current Serie A listone in a single request. */
module.exports = async function collectFantacalcioListone(url) {
    const response = await fetchHtml(url || DEFAULT_LISTONE_URL);
    return parseListone(response.text);
};
