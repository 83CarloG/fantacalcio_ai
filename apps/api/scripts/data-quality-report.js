"use strict";
// Data-quality snapshot of the FPEDIA/Fantacalcio dataset, run BEFORE choosing any ensemble
// weights (see docs/adr + Indicator Model v2 plan): distributions, FCP↔ALG correlation and
// disagreement outliers, projection-range census, skills co-occurrence. Read-only on the DB;
// writes a versioned markdown report to docs/reports/. Correlation is computed to understand
// redundancy/agreement between the two editorial signals — NOT causality.
const fs = require("node:fs");
const path = require("node:path");
const database = require("../src/drivers/database");

const db = database();

// latest FPEDIA_REFRESH snapshot per player (players may have several after re-enrichments)
const rows = db.prepare(`
    SELECT p.player_id, p.name, p.full_name, p.team, p.role, ps.payload_json
    FROM players p
    JOIN player_snapshots ps ON ps.id = (
        SELECT id FROM player_snapshots
        WHERE player_id = p.player_id AND snapshot_type = 'FPEDIA_REFRESH'
        ORDER BY observed_at DESC, id DESC LIMIT 1
    )
    WHERE p.status = 'ACTIVE'
`).all();

const players = rows.map((row) => {
    const payload = JSON.parse(row.payload_json);
    const data = (payload.sources && payload.sources.fpedia && payload.sources.fpedia.data) || {};
    return {playerId: row.player_id, name: row.full_name || row.name, team: row.team, role: row.role, data};
});

const totalActive = db.prepare("SELECT COUNT(*) c FROM players WHERE status = 'ACTIVE'").get().c;
const noFpediaByRole = db.prepare(`
    SELECT role, COUNT(*) c FROM players
    WHERE status='ACTIVE' AND player_id NOT IN (SELECT player_id FROM player_source_identities WHERE source='fpedia')
    GROUP BY role ORDER BY role
`).all();

// ---------- helpers ----------
function quantiles(values) {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const q = (p) => sorted[Math.floor(p * (sorted.length - 1))];
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    return {n: values.length, min: sorted[0], p25: q(0.25), median: q(0.5), p75: q(0.75), max: sorted[sorted.length - 1], mean: +mean.toFixed(2), std: +std.toFixed(2)};
}
function pearson(xs, ys) {
    const n = xs.length;
    if (n < 3) return null;
    const mx = xs.reduce((s, v) => s + v, 0) / n;
    const my = ys.reduce((s, v) => s + v, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
    return dx && dy ? +(num / Math.sqrt(dx * dy)).toFixed(4) : null;
}
function ranks(values) {
    const indexed = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const out = new Array(values.length);
    let i = 0;
    while (i < indexed.length) {
        let j = i;
        while (j + 1 < indexed.length && indexed[j + 1][0] === indexed[i][0]) j++;
        const avgRank = (i + j) / 2 + 1;
        for (let k = i; k <= j; k++) out[indexed[k][1]] = avgRank;
        i = j + 1;
    }
    return out;
}
function spearman(xs, ys) { return pearson(ranks(xs), ranks(ys)); }
function fmtQ(q) { return q ? `n=${q.n} min=${q.min} p25=${q.p25} med=${q.median} p75=${q.p75} max=${q.max} mean=${q.mean} std=${q.std}` : "n=0"; }

// ---------- missingness ----------
const missing = {
    fcpMissing: players.filter((p) => p.data.editorialFcpScore == null).length,
    algMissing: players.filter((p) => p.data.algorithmScore == null).length,
    algZero: players.filter((p) => p.data.algorithmScore === 0).length,
    historyMissing: players.filter((p) => !(p.data.history || []).some((h) => h.averageVote !== null)).length,
    projectionsMissing: players.filter((p) => !p.data.projections || p.data.projections.appearances == null).length,
    ambiguities: players.filter((p) => (p.data.parsingAmbiguities || []).length > 0)
};

// ---------- distributions per role ----------
const roles = ["P", "D", "C", "A"];
const dist = {};
for (const role of roles) {
    const inRole = players.filter((p) => p.role === role);
    dist[role] = {
        fcp: quantiles(inRole.map((p) => p.data.editorialFcpScore).filter((v) => v != null)),
        alg: quantiles(inRole.map((p) => p.data.algorithmScore).filter((v) => v != null && v > 0))
    };
}

// ---------- FCP vs ALG correlation + disagreement ----------
const both = players.filter((p) => p.data.editorialFcpScore != null && p.data.algorithmScore != null && p.data.algorithmScore > 0);
const fcps = both.map((p) => p.data.editorialFcpScore);
const algs = both.map((p) => p.data.algorithmScore);
const correlation = {
    global: {n: both.length, pearson: pearson(fcps, algs), spearman: spearman(fcps, algs)},
    perRole: {}
};
for (const role of roles) {
    const inRole = both.filter((p) => p.role === role);
    correlation.perRole[role] = {
        n: inRole.length,
        pearson: pearson(inRole.map((p) => p.data.editorialFcpScore), inRole.map((p) => p.data.algorithmScore)),
        spearman: spearman(inRole.map((p) => p.data.editorialFcpScore), inRole.map((p) => p.data.algorithmScore))
    };
}
const disagreements = both
    .map((p) => ({name: p.name, team: p.team, role: p.role, fcp: p.data.editorialFcpScore, alg: p.data.algorithmScore, gap: Math.abs(p.data.editorialFcpScore - p.data.algorithmScore)}))
    .sort((a, b) => b.gap - a.gap);
const gapStats = quantiles(disagreements.map((d) => d.gap));

// ---------- projection range census ----------
const rangeCensus = {closed: 0, openEnded: 0, bare: 0, missing: 0, violations: 0};
const widths = {P: [], D: [], C: [], A: []};
for (const p of players) {
    for (const key of ["appearances", "goals", "assists"]) {
        const range = p.data.projections && p.data.projections[key];
        if (!range) { rangeCensus.missing++; continue; }
        if (range.ambiguity) { rangeCensus.violations++; continue; }
        if (range.openEnded) rangeCensus.openEnded++;
        else if (range.raw.includes("/")) rangeCensus.closed++;
        else rangeCensus.bare++;
        if (!range.openEnded && range.min != null) widths[p.role]?.push(range.max - range.min);
    }
}

// ---------- skills distribution + co-occurrence ----------
const skillCounts = {};
const cooccurrence = {};
for (const p of players) {
    const skills = p.data.skills || [];
    for (const s of skills) skillCounts[s] = (skillCounts[s] || 0) + 1;
    for (const pair of [["Titolare", "Panchinaro"], ["Rigorista", "Goleador"], ["Giovane talento", "Outsider"], ["Titolare", "Buona Media"]]) {
        if (skills.includes(pair[0]) && skills.includes(pair[1])) {
            const key = pair.join(" + ");
            cooccurrence[key] = (cooccurrence[key] || 0) + 1;
        }
    }
}

// ---------- report ----------
const today = new Date().toISOString().slice(0, 10);
const lines = [];
lines.push(`# Data Quality Report — ${today}`);
lines.push("");
lines.push(`Generated by \`apps/api/scripts/data-quality-report.js\` against the live runtime DB. Read-only. Correlation figures describe redundancy/agreement between the two editorial signals, not causality.`);
lines.push("");
lines.push(`## Coverage`);
lines.push(`- Active players (listone): **${totalActive}**`);
lines.push(`- With FPEDIA snapshot: **${players.length}**`);
lines.push(`- Without FPEDIA (by role): ${noFpediaByRole.map((r) => `${r.role}:${r.c}`).join(", ")}`);
lines.push("");
lines.push(`## Missingness`);
lines.push(`- FCP missing: **${missing.fcpMissing}**`);
lines.push(`- ALG missing (field absent): **${missing.algMissing}**`);
lines.push(`- ALG = 0 (not-computed sentinel): **${missing.algZero}**`);
lines.push(`- No usable Serie A fantavoto history: **${missing.historyMissing}**`);
lines.push(`- Projections missing: **${missing.projectionsMissing}**`);
lines.push(`- Players with parsing ambiguities: **${missing.ambiguities.length}**${missing.ambiguities.length ? " → " + missing.ambiguities.map((p) => p.name).join(", ") : ""}`);
lines.push("");
lines.push(`## Distributions per role (usable values only)`);
for (const role of roles) {
    lines.push(`- **${role}** — FCP: ${fmtQ(dist[role].fcp)}`);
    lines.push(`  - ALG: ${fmtQ(dist[role].alg)}`);
}
lines.push("");
lines.push(`## FCP ↔ ALG correlation (players with both usable, n=${correlation.global.n})`);
lines.push(`- Global: Pearson **${correlation.global.pearson}**, Spearman **${correlation.global.spearman}**`);
for (const role of roles) {
    const c = correlation.perRole[role];
    lines.push(`- ${role}: n=${c.n}, Pearson ${c.pearson}, Spearman ${c.spearman}`);
}
lines.push("");
lines.push(`## Disagreement |FCP − ALG|`);
lines.push(`- Distribution: ${fmtQ(gapStats)}`);
lines.push(`- Top 10 outliers:`);
for (const d of disagreements.slice(0, 10)) {
    lines.push(`  - ${d.name} (${d.role}, ${d.team}): FCP ${d.fcp} vs ALG ${d.alg} → gap ${d.gap}`);
}
lines.push("");
lines.push(`## Projection range census (3 ranges per player)`);
lines.push(`- Closed X/Y: ${rangeCensus.closed} · Open N+: ${rangeCensus.openEnded} · Bare N: ${rangeCensus.bare} · Missing: ${rangeCensus.missing} · min>max violations: **${rangeCensus.violations}**`);
for (const role of roles) {
    lines.push(`- Closed-range width ${role}: ${fmtQ(quantiles(widths[role]))}`);
}
lines.push("");
lines.push(`## Skills`);
for (const [skill, count] of Object.entries(skillCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${skill}: ${count}`);
}
lines.push("");
lines.push(`## Skills co-occurrence (double-counting checks)`);
const pairs = Object.entries(cooccurrence);
if (pairs.length === 0) lines.push(`- none of the checked pairs co-occur`);
for (const [pair, count] of pairs) lines.push(`- ${pair}: ${count}`);
lines.push("");

const outDir = path.resolve(__dirname, "..", "..", "..", "docs", "reports");
fs.mkdirSync(outDir, {recursive: true});
const outFile = path.join(outDir, `data-quality-${today}.md`);
fs.writeFileSync(outFile, lines.join("\n"));
console.log(`Report written to ${outFile}`);
console.log(lines.join("\n"));
