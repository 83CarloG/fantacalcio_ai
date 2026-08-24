"use strict";
const fetchHtml = require("../jobs/fetchFpediaHtmlWithRetry");
const parseDetail = require("../jobs/parseFpediaPlayerDetail");

/** Fetch (with retry/backoff) + parse one FPEDIA player detail page. */
module.exports = async function collectFpediaPlayerDetail(url) {
    const response = await fetchHtml(url);
    return parseDetail(response.text);
};
