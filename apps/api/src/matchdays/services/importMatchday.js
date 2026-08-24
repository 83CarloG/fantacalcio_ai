"use strict";
const importMatchdayStats = require("../features/importMatchdayStats");
module.exports = async function importMatchday(matchdayNumber, stats) { return importMatchdayStats(matchdayNumber, stats); };
