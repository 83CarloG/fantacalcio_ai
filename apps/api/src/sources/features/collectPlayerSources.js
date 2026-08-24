"use strict";
const collectFantacalcio = require("../operations/collectFantacalcio");
const collectFpedia = require("../operations/collectFpedia");
module.exports = async function collectPlayerSources(payload) {
    const [fantacalcio, fpedia] = await Promise.all([collectFantacalcio(payload.fantacalcioUrl), collectFpedia(payload.fpediaUrl)]);
    return {fantacalcio, fpedia};
};
