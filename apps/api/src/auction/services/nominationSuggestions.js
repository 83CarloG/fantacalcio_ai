"use strict";
const listPlayers = require("../../players/jobs/listPlayers");
const buildNominationSuggestions = require("../features/buildNominationSuggestions");

module.exports = async function nominationSuggestions(season) {
    const players = await listPlayers({});
    return buildNominationSuggestions(season, players);
};
