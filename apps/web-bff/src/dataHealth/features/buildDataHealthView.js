"use strict";
const getDataHealth = require("../jobs/getDataHealth");

const BUCKET_TONE = {under24h: "success", d1to3: "success", d3to7: "", d7to14: "warning", over14d: "danger"};

function percent(part, total) {
    return total > 0 ? Math.round((part / total) * 100) : 0;
}

function formatAge(ageHours) {
    if (ageHours < 1) return "meno di un'ora fa";
    if (ageHours < 24) return `${Math.round(ageHours)} ore fa`;
    const days = Math.round(ageHours / 24);
    return days === 1 ? "1 giorno fa" : `${days} giorni fa`;
}

/**
 * Shapes the four independent status reads from GET /v1/data-health into the plain view
 * model the data-health page template renders — percentages, bucket tones and relative ages
 * computed here so the template stays a dumb renderer, matching every other feature in this
 * codebase (see buildFpediaProgress.js, buildDashboard.js).
 */
module.exports = async function buildDataHealthView() {
    const {indicatorStaleness, fpediaStatus, seasonStatsCoverage, importHistory} = await getDataHealth();
    const total = indicatorStaleness.total;

    return {
        title: "Diagnostica dati",
        coverage: {
            fpediaIdentity: {percent: percent(fpediaStatus.IDENTIFIED || 0, total), count: fpediaStatus.IDENTIFIED || 0, total},
            indicators: {percent: percent(indicatorStaleness.withIndicators, total), count: indicatorStaleness.withIndicators, total},
            seasonStats: seasonStatsCoverage.latestMatchday === null
                ? {started: false}
                : {
                    started: true,
                    percent: percent(seasonStatsCoverage.atLatestMatchday, seasonStatsCoverage.total),
                    count: seasonStatsCoverage.atLatestMatchday,
                    total: seasonStatsCoverage.total,
                    matchday: seasonStatsCoverage.latestMatchday
                }
        },
        staleness: {
            neverComputed: indicatorStaleness.neverComputed,
            buckets: indicatorStaleness.buckets.map((bucket) => ({...bucket, tone: BUCKET_TONE[bucket.key] || ""})),
            mostStale: indicatorStaleness.mostStale.map((player) => ({...player, ageLabel: formatAge(player.ageHours)}))
        },
        importHistory: Object.entries(importHistory.byType).map(([importType, runs]) => ({importType, runs}))
    };
};
