"use strict";
const backendApi = require("../../drivers/backendApi");

/** Trigger the bulk season-statistics import (as_of_matchday self-derived from the data). */
module.exports = async function importSeasonStats() {
    return backendApi({method: "POST", pathname: "/v1/sources/fantacalcio/season-stats"});
};
