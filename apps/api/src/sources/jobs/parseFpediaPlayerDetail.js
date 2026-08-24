"use strict";
const cheerio = require("cheerio");
const parseProjectionRange = require("../../shared/parseProjectionRange");

function numberFrom(text) {
    const match = String(text || "").match(/(\d+)/);
    return match ? Number(match[1]) : null;
}

/**
 * "0.00" and "nd" are both no-data sentinels in FPEDIA average-vote fields, verified live
 * on 2026-08-10: Chakvetadze shows "Fanta Media 2025-26: 0.00" with 29 appearances (foreign
 * league, no fantavoto exists) and Paz shows "nd" for his pre-Serie A season. A true 0.00
 * average is impossible for a player with real Serie A votes (votes run ~4-10), so mapping
 * both to null cannot destroy a legitimate measurement.
 */
function parseAverageVote(text) {
    const raw = String(text || "").trim();
    if (raw === "" || raw.toLowerCase() === "nd") return null;
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value) || value === 0) return null;
    return value;
}

/**
 * Parse one FPEDIA player detail page. Extracts BOTH editorial signals — kept strictly
 * separate, never merged into a generic "score":
 *   - `algorithmScore`   ("Algoritmo Fantacalciopedia", ALG — raw as printed, 0 included:
 *                          usability semantics live in jobs/assessAlgorithmScoreUsability.js)
 *   - `editorialFcpScore` ("Punteggio FantaCalcioPedia", FCP — present even when ALG=0,
 *                          verified live on all ALG=0 pages checked)
 * plus projections (site-labelled "(range)": see jobs/parseProjectionRange.js for the three
 * real forms and the min>max ambiguity contract), season history with sentinel handling
 * ("nd"/"0.00" → null, appearances kept — they may be foreign-league appearances), current
 * season block, skill tags, and the 5-level solidity/resistance ordinals (stored ×20 as
 * percentages; the underlying scale is X-su-5, so only {20,40,60,80,100} occur).
 * Anything that parsed suspiciously lands in `parsingAmbiguities[]` — never silently fixed;
 * the batch runner flags those players NEEDS_REVIEW (see features/enrichFpediaBatch.js).
 *
 * `flags.injured` is deliberately read only from the scoped skill-tag list, NOT a full-page
 * text search: an earlier version searched the whole body for "infortunat..." and false-
 * positived on every player because of the site's global nav link "Lista infortunati Serie A".
 */
module.exports = function parseFpediaPlayerDetail(html) {
    const $ = cheerio.load(html);
    const bodyText = $("body").text();
    const parsingAmbiguities = [];

    const algorithmScoreText = $('strong:contains("Algoritmo Fantacalciopedia")').parent().find(".stickdan").first().text();

    // FCP: the skills bar list carries it as a structured attribute
    // (<li data-percent="81"><span>Punteggio FantaCalcioPedia</span>); fall back to the
    // "Punteggio FCP: 81" chart caption if the bar is ever absent.
    let editorialFcpScore = null;
    $("ul.skills li").each(function () {
        if ($(this).find("span").first().text().trim() === "Punteggio FantaCalcioPedia") {
            editorialFcpScore = numberFrom($(this).attr("data-percent"));
        }
    });
    if (editorialFcpScore === null) {
        const fcpMatch = bodyText.match(/Punteggio FCP:\s*(\d+)/);
        if (fcpMatch) editorialFcpScore = Number(fcpMatch[1]);
    }

    const fiveScalePct = function (label) {
        const match = bodyText.match(new RegExp(`${label}[:\\s]*\\s*(\\d)\\s*su\\s*5`, "i"));
        return match ? Math.round((Number(match[1]) / 5) * 100) : null;
    };

    // projections: the "Riepilogo previsionali" section prints them as plain
    // "<label>: <value> (range)" text; the "(range)" suffix is the site's own labelling.
    const projection = function (label) {
        const match = bodyText.match(new RegExp(`${label}:\\s*(\\S+)\\s*\\(range\\)`));
        const range = parseProjectionRange(match ? match[1] : null);
        if (range && range.ambiguity) parsingAmbiguities.push(`${label}: ${range.ambiguity}`);
        return range;
    };
    const projections = {
        appearances: projection("Presenze previste"),
        goals: projection("Gol previsti"),
        assists: projection("Assist previsti")
    };

    // history: one "Media Fanta Voto YYYY-YYYY" block per season, each in its own .label12
    // (value in .stickdan — "nd"/"0.00" are sentinels; appearances in the .rouge span)
    const history = [];
    $("strong").each(function () {
        const seasonMatch = $(this).text().trim().match(/^Media Fanta Voto (\d{4}-\d{4})$/);
        if (!seasonMatch) return;
        const block = $(this).parent();
        history.push({
            season: seasonMatch[1],
            averageVote: parseAverageVote(block.find(".stickdan").first().text()),
            appearances: numberFrom(block.find(".rouge").first().text())
        });
    });

    // current season block: "Presenze YYYY / Fanta Media YYYY / FM su tot gare YYYY" strongs,
    // each followed (same .label12) by its .stickdan value
    const currentSeasonValue = function (labelPattern) {
        let value = null;
        $("strong").each(function () {
            if (value !== null) return;
            if (labelPattern.test($(this).text().trim())) {
                value = $(this).nextAll("span.stickdan").first().text().trim();
            }
        });
        return value;
    };
    const currentSeasonMatch = bodyText.match(/Presenze (\d{4}-\d{4}):/);
    const currentSeason = currentSeasonMatch ? {
        season: currentSeasonMatch[1],
        appearances: numberFrom(currentSeasonValue(/^Presenze \d{4}-\d{4}:$/)),
        fantasyAverage: parseAverageVote(currentSeasonValue(/^Fanta Media \d{4}-\d{4}:$/)),
        distributedAverage: parseAverageVote(currentSeasonValue(/^FM su tot gare \d{4}-\d{4}:$/))
    } : null;

    const skills = $(".stickdanpic").map(function () { return $(this).text().trim(); }).get().filter(Boolean);

    return {
        algorithmScore: numberFrom(algorithmScoreText),
        editorialFcpScore,
        investmentSolidityPct: fiveScalePct("Solidit[àa] dell'investimento fantacalcistico"),
        injuryResistancePct: fiveScalePct("Resistenza agli infortuni"),
        projections,
        history,
        currentSeason,
        skills,
        flags: {injured: skills.some((skill) => /infortunat/i.test(skill))},
        parsingAmbiguities
    };
};
