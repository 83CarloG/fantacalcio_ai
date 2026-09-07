"use strict";
const getSuggestions = require("../jobs/getSuggestions");

const CURRENT_SEASON = "2026-27";
const ROLE_LABEL = {P: "Portieri", D: "Difensori", C: "Centrocampisti", A: "Attaccanti"};

function withLabel(group) {
    return {...group, label: ROLE_LABEL[group.role]};
}

module.exports = async function buildSuggestPage() {
    const suggestions = await getSuggestions(CURRENT_SEASON);
    return {
        season: CURRENT_SEASON,
        currentPhase: suggestions.currentPhase,
        currentPhaseLabel: suggestions.currentPhase ? ROLE_LABEL[suggestions.currentPhase] : null,
        targetsByRole: suggestions.targetsByRole.map(withLabel),
        decoysByRole: suggestions.decoysByRole.map(withLabel),
        scarcityByRole: suggestions.scarcityByRole.map(withLabel)
    };
};
