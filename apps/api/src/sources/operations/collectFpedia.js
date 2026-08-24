"use strict";
const fetchHtml = require("../jobs/fetchFpediaHtml");
const parseIdentity = require("../jobs/parseFpediaIdentity");
module.exports = async function collectFpedia(url) {
    const response = await fetchHtml(url);
    return {status: "success", sourceUrl: response.url, httpStatus: response.status, data: await parseIdentity(response.text)};
};
