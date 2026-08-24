"use strict";
const fetchHtml = require("../jobs/fetchFpediaHtml");
const parseIndex = require("../jobs/parseFpediaPlayerIndex");

/** Fetch + parse one FPEDIA role-index page (fetch and parse are the two jobs it composes). */
module.exports = async function collectFpediaPlayerIndex(url) {
    const response = await fetchHtml(url);
    return parseIndex(response.text);
};
