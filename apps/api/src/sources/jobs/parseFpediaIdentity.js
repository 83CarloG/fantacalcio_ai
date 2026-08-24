"use strict";
const cheerio = require("cheerio");
module.exports = async function parseFpediaIdentity(html) {
    const $ = cheerio.load(html);
    return {name: $("h1").first().text().trim() || null};
};
