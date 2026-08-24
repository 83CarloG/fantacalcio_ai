"use strict";
const cheerio = require("cheerio");
module.exports = async function parseFantacalcioIdentity(html) {
    const $ = cheerio.load(html);
    const title = $("h1").first().text().trim() || $("title").text().trim();
    return {name: title || null};
};
