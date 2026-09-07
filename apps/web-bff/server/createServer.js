"use strict";
const path = require("node:path");
const Fastify = require("fastify");
const view = require("@fastify/view");
const staticPlugin = require("@fastify/static");
const formbody = require("@fastify/formbody");
const handlebars = require("handlebars");
const pageRoutes = require("./routes/pages");
const liveRoutes = require("./routes/live");
handlebars.registerHelper("json", function (value) { return JSON.stringify(value, null, 2); });
// used by the header nav to mark the current section active
handlebars.registerHelper("eq", function (a, b) { return a === b; });
handlebars.registerHelper("startsWith", function (value, prefix) { return String(value || "").startsWith(prefix); });
// plain-language labels for the raw tokens the API returns, so the player page doesn't show
// an unexplained "medium"/"single-season-2025-26" to a non-technical user
const CONFIDENCE_LABELS = {medium: "confidenza media", low: "confidenza bassa", high: "confidenza alta"};
handlebars.registerHelper("confidenceLabel", function (value) { return CONFIDENCE_LABELS[value] || value; });
handlebars.registerHelper("calibrationLabel", function (value) {
    return value === "single-season-2025-26" ? "calibrato su una sola stagione (2025-26)" : value;
});
// the API's `indicators.warnings` strings are English (matching docs/algorithm.md and the
// rest of the API's technical text) — translate the ones we know, and fall back to showing
// the original text rather than hiding an unrecognized-but-still-important warning
const WARNING_LABELS = {
    "Market calibration currently uses one complete auction season only.": "La calibrazione di mercato si basa per ora su una sola stagione d'asta completa.",
    "Ensemble FCP/ALG weights are an uncalibrated 50/50 baseline, pending early-season validation.": "I pesi dell'ensemble FCP/ALG sono una baseline 50/50 non calibrata, in attesa di validazione con le prime giornate.",
    "Editorial signals disagree (|FCP - ALG| > 20).": "I due segnali editoriali FPEDIA sono in forte disaccordo (differenza > 20 punti).",
    "FCP is at its floor value (30): the FPEDIA page is likely not yet editorially reviewed.": "Il punteggio FCP è al valore minimo (30): la scheda FPEDIA probabilmente non è ancora stata recensita.",
    "ALG not computed for this player: technical prior uses FCP only.": "Algoritmo FPEDIA non ancora calcolato per questo giocatore: la valutazione tecnica usa solo il punteggio editoriale FCP.",
    "No editorial signal usable: technical prior unavailable from FCP/ALG.": "Nessun segnale editoriale utilizzabile: valutazione tecnica non derivabile da FCP/ALG.",
    "Scarcity/VORP use demand-based replacement (24/64/64/48), uncalibrated.": "Scarsità e VORP usano il replacement basato sulla domanda reale di rosa (24/64/64/48), non ancora calibrato.",
    "Technical score unavailable: no usable technical input for this player.": "Punteggio tecnico non disponibile: nessun input tecnico utilizzabile per questo giocatore.",
    "Expected price unavailable: this player has no FVM quotation in the listone yet.": "Prezzo atteso non disponibile: questo giocatore non ha ancora una quotazione FVM nel listone."
};
handlebars.registerHelper("warningLabel", function (value) { return WARNING_LABELS[value] || value; });
// plain-language label + a lowercase modifier class for the run-status pill (players.handlebars)
const RUN_STATUS_LABELS = {SUCCESS: "Completato", RUNNING: "In corso", FAILED: "Fallito"};
handlebars.registerHelper("runStatusLabel", function (value) { return RUN_STATUS_LABELS[value] || "Non eseguito"; });
module.exports = async function createServer() {
    const app = Fastify({logger: true});
    // Real form-field parsing: the auction live page's forms (record a pick, add a manager)
    // need actual posted fields, unlike the bodyless admin action buttons elsewhere on this
    // site (which just POST to a distinct path/segment and never read request.body).
    await app.register(formbody);
    // No global `layout` here (Task F): @fastify/view refuses to combine a global layout
    // with a per-render override ("A layout can either be set globally or on render, not
    // both"), and the Live app needs its own minimal layout — so every route passes its
    // layout explicitly instead (see MAIN_LAYOUT in routes/pages.js, LIVE_LAYOUT in
    // routes/live.js).
    await app.register(view, {engine: {handlebars}, root: path.join(__dirname, "views")});
    // __dirname-relative so this works both from the repo root and from `npm --workspace`
    await app.register(staticPlugin, {root: path.resolve(__dirname, "..", "public"), prefix: "/assets/"});
    await app.register(pageRoutes);
    await app.register(liveRoutes);
    return app;
};
