"use strict";
const getPlayers = require("../jobs/getPlayers");
const getMarketModel = require("../jobs/getMarketModel");
const getListoneStatus = require("../jobs/getListoneStatus");
const getFpediaStatus = require("../jobs/getFpediaStatus");
const getIndicatorsStatus = require("../jobs/getIndicatorsStatus");

/**
 * The setup checklist shown on a fresh/empty dashboard: three gating steps, each derived from
 * a real status signal (never a guess) — listone import run, FPEDIA enrichment counts, and
 * indicator-snapshot coverage. "Ricalcola indicatori" reads as done once at least one player
 * has a persisted snapshot; a full recalculation already runs automatically right after FPEDIA
 * enrichment succeeds (see apps/api/server/routes/sources.js), so this step is usually satisfied
 * by step 2 rather than needing its own manual trigger.
 */
function buildSetupSteps({listoneStatus, fpediaStatus, indicatorsStatus}) {
    const listoneDone = Boolean(listoneStatus && listoneStatus.status === "SUCCESS");
    const listoneRunning = Boolean(listoneStatus && listoneStatus.status === "RUNNING");
    const fpediaSuccess = (fpediaStatus && fpediaStatus.SUCCESS) || 0;
    const fpediaDone = fpediaSuccess > 0;
    const indicatorsCoverage = indicatorsStatus && indicatorsStatus.total ? indicatorsStatus : {total: 0, withIndicators: 0};
    const indicatorsDone = indicatorsCoverage.withIndicators > 0;

    const steps = [
        {
            number: 1,
            label: "Importa il listone da Fantacalcio.it",
            done: listoneDone,
            detail: listoneDone ? "Fatto" : listoneRunning ? "In corso" : "Da fare"
        },
        {
            number: 2,
            label: "Avvia l'enrichment FPEDIA",
            done: fpediaDone,
            detail: fpediaDone ? `${fpediaSuccess} completati` : listoneDone ? "Da fare" : "In attesa del passaggio 1"
        },
        {
            number: 3,
            label: "Ricalcola gli indicatori",
            done: indicatorsDone,
            detail: indicatorsDone
                ? `${indicatorsCoverage.withIndicators}/${indicatorsCoverage.total} giocatori`
                : fpediaDone ? "Da fare" : "In attesa del passaggio 2"
        }
    ];
    const completedCount = steps.filter((step) => step.done).length;
    return {steps, completedCount, totalSteps: steps.length, allDone: completedCount === steps.length};
}

// the "Giocatori campione" panel is a small taste of the roster with a link to the full
// listone, not a second copy of it — fine at 3 seed rows, but a real ~500-player import
// would otherwise dump the entire table onto the dashboard.
const SAMPLE_SIZE = 5;

module.exports = async function buildDashboard() {
    const [players, marketModel, listoneStatus, fpediaStatus, indicatorsStatus] = await Promise.all([
        getPlayers(), getMarketModel(), getListoneStatus(), getFpediaStatus(), getIndicatorsStatus()
    ]);
    return {
        title: "Fanta Luminous",
        players: players.slice(0, SAMPLE_SIZE),
        marketModel,
        playerCount: players.length,
        setup: buildSetupSteps({listoneStatus, fpediaStatus, indicatorsStatus})
    };
};
