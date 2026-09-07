"use strict";
const getPlayer = require("../jobs/getPlayer");
const getIndicators = require("../jobs/getIndicators");

function value(v) {
    return v === null || v === undefined ? null : v;
}

/**
 * Reshape the raw indicators payload into small labeled {label, value} lists the template
 * can loop over generically, instead of a `{{json indicators}}` dump — every field here is
 * still the API's real number, just organized and named for a human instead of a debugger.
 * `null`/`undefined` pass through as `value: null` (never coerced to 0/"—" here) so the
 * template's own `{{#if}}` decides the empty-state text in one place.
 */
function buildIndicatorDisplay(indicators) {
    if (!indicators) return null;
    const t = indicators.technical;
    const u = indicators.uncertainty;
    const r = indicators.relativeValue;
    const l = indicators.leagueSpecific;
    const hasLeagueSpecificData = [l.defenseModifierValue, l.fantacalcioFantasyAverage, l.observedBonusPerGame, l.matchesWithVote]
        .some((field) => field !== null && field !== undefined);

    return {
        confidence: value(indicators.confidence),
        reasons: indicators.reasons || [],
        technical: [
            {label: "Punteggio ensemble (preseason)", value: value(t.ensembleScore), detail: t.ensembleSource},
            {label: "Editoriale FCP", value: value(t.editorialFcpScore)},
            {label: "Editoriale ALG", value: value(t.algorithmScore), detail: t.algorithmScoreStatus !== "available" ? t.algorithmScoreStatus : null},
            {label: "Proiezione stagionale", value: value(t.projectionScore)},
            {label: "Storico (MV pesata)", value: value(t.historicalScore)},
            {label: "Disponibilità", value: value(t.availabilityScore)},
            {label: "Potenziale bonus", value: value(t.bonusPotentialScore)},
            {label: "Upside", value: value(t.upsideScore)},
            {label: "Punteggio prime giornate", value: value(t.earlySeasonScore), detail: t.earlySeasonWeight ? `peso ${Math.round(t.earlySeasonWeight * 100)}%` : null}
        ],
        risk: [
            {label: "Rischio infortuni", value: value(u.injuryRisk)},
            {label: "Rischio di ruolo", value: value(u.roleRisk)},
            {label: "Rischio di adattamento", value: value(u.adaptationRisk)},
            {label: "Rischio disciplinare", value: value(u.disciplinaryRisk)},
            {label: "Punteggio di confidenza", value: value(u.confidenceScore)},
            {label: "Completezza dati", value: value(u.dataCompleteness)}
        ],
        relativeValue: [
            {label: "Posizione nel ruolo", value: value(r.roleRank)},
            {label: "Fascia", value: value(r.tier)},
            {label: "Livello di replacement", value: value(r.replacementScore)},
            {label: "VORP", value: value(r.vorp)},
            {label: "Alternative equivalenti vicine", value: value(r.alternativesWithinFive)}
        ],
        leagueSpecific: hasLeagueSpecificData
            ? [
                {label: "Modificatore difesa", value: value(l.defenseModifierValue)},
                {label: "Media fantavoto osservata", value: value(l.fantacalcioFantasyAverage)},
                {label: "Bonus osservati/partita", value: value(l.observedBonusPerGame)},
                {label: "Partite votate", value: value(l.matchesWithVote)}
            ]
            : null,
        meta: {modelVersion: indicators.modelVersion, modelSeason: indicators.modelSeason, computedAt: indicators.computedAt}
    };
}

/**
 * Compose the player detail page view model.
 *
 * @param {string|number} id
 */
module.exports = async function buildPlayerPage(id) {
    const player = await getPlayer(id);

    // A player with no FPEDIA-flavored snapshot yet (e.g. resolved only via the Fantacalcio.it
    // detail-page fallback during identity reconciliation) has no indicators to compute — the
    // API 404s (see indicators/features/buildPlayerIndicators.js). That is an expected state,
    // not a page-breaking error: render the page with indicators = null instead of crashing.
    let indicators = null;
    try {
        indicators = await getIndicators(id);
    } catch (_error) {
        indicators = null;
    }

    return {title: player.name, player, indicators, display: buildIndicatorDisplay(indicators)};
};
