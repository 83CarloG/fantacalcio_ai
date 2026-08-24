"use strict";
const fetchHtml = require("../jobs/fetchFantacalcioHtml");
const parseIdentity = require("../jobs/parseFantacalcioIdentity");
module.exports = async function collectFantacalcio(url) {
    const response = await fetchHtml(url);
    return {status: "success", sourceUrl: response.url, httpStatus: response.status, data: await parseIdentity(response.text)};
};
