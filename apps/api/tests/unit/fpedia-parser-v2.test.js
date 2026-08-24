"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const parseProjectionRange = require("../../src/shared/parseProjectionRange");
const parseFpediaPlayerDetail = require("../../src/sources/jobs/parseFpediaPlayerDetail");

// ---- parseProjectionRange: the three real forms observed live (2026-08-10) ----

test("parseProjectionRange parses a closed X/Y range as min/max", function () {
    assert.deepEqual(parseProjectionRange("4/7"), {raw: "4/7", min: 4, max: 7, openEnded: false, ambiguity: null});
});

test("parseProjectionRange parses an open-ended N+ range with max null, never inventing a max", function () {
    assert.deepEqual(parseProjectionRange("30+"), {raw: "30+", min: 30, max: null, openEnded: true, ambiguity: null});
});

test("parseProjectionRange parses a bare value as a degenerate closed range", function () {
    assert.deepEqual(parseProjectionRange("0"), {raw: "0", min: 0, max: 0, openEnded: false, ambiguity: null});
});

test("parseProjectionRange flags min>max as ambiguity instead of silently swapping", function () {
    const result = parseProjectionRange("7/4");
    assert.equal(result.min, null);
    assert.equal(result.max, null);
    assert.match(result.ambiguity, /min>max/);
});

test("parseProjectionRange flags an unrecognized format rather than guessing", function () {
    const result = parseProjectionRange("molti");
    assert.match(result.ambiguity, /unrecognized/);
});

test("parseProjectionRange returns null for empty/absent input", function () {
    assert.equal(parseProjectionRange(""), null);
    assert.equal(parseProjectionRange(null), null);
});

// ---- parseFpediaPlayerDetail: fixture trimmed from the real page markup (2026-08-10) ----

const FIXTURE_HTML = `
<div class="col_one_fourth nobottommargin">
  <div class="label12">
    <strong>Algoritmo Fantacalciopedia</strong><br />
    <span class="stickdan fondocobalto"> 96<small>/100</small></span>
  </div>
</div>
<div class="col_one_fourth nobottommargin">
  <div class="label12">
    <strong>Media Fanta Voto 2025-2026</strong><br />
    <span class="stickdan fondocobalto"> 7.30<i class="frec_v icon-arrow-up icon"></i> </span>
    <span>su <span class="rouge">35</span> pres</span>
  </div>
</div>
<div class="col_one_fourth nobottommargin">
  <div class="label12">
    <strong>Media Fanta Voto 2024-2025</strong><br />
    <span class="stickdan "> 6.89 </span>
    <span>su <span class="rouge">33</span> pres</span>
  </div>
</div>
<div class="col_one_fourth nobottommargin col_last ">
  <div class="label12">
    <strong>Media Fanta Voto 2023-2024</strong><br />
    <span class="stickdan fondorouge"> nd</span>
    <span>su <span class="rouge">0</span> pres</span>
  </div>
</div>
<div class="col_one_third">
  <div class="label12">
    <strong>Presenze 2025-2026:</strong><br />
    <span class="stickdan fondocobalto"> 35</span><br />
    <strong>Fanta Media 2025-2026:</strong><br />
    <span class="stickdan fondocobalto"> 7.30</span><br />
    <strong>FM su tot gare 2025-2026:</strong><br />
    <span class="stickdan fondocobalto"> 6.72</span><br />
  </div>
</div>
<div class="col_one_fourth"><span class="stickdanpic">Titolare</span></div>
<div class="col_one_fourth"><span class="stickdanpic">Fuoriclasse</span></div>
<div class="col_half center" id="doughnutChart">
  <p class="center"> <strong>Punteggio FCP: <span class="font30 cobalto">81</span></strong></p>
</div>
<ul class="skills">
  <li data-percent="96"><span>ALG FCP</span></li>
  <li data-percent="81"><span>Punteggio FantaCalcioPedia</span></li>
</ul>
<div class="topmargin font18">
  <div class="fancy-title title-bottom-border"><h2 class="panel-title">Riepilogo previsionali</h2></div>
  <strong>Solidità dell'investimento fantacalcistico:</strong> 4 su 5
  <br /><strong>Resistenza agli infortuni:</strong> 3 su 5
  <br /><strong>Presenze previste:</strong> 30+ (range)
  <br /><strong>Gol previsti:</strong> 4/7 (range)
  <br /><strong>Assist previsti:</strong> 3/5 (range)
</div>
<nav>Lista infortunati Serie A</nav>
`;

test("parser v2 keeps ALG and FCP as two separate, explicitly named signals", function () {
    const detail = parseFpediaPlayerDetail(FIXTURE_HTML);
    assert.equal(detail.algorithmScore, 96);
    assert.equal(detail.editorialFcpScore, 81);
});

test("parser v2 extracts the three projections with correct range semantics", function () {
    const detail = parseFpediaPlayerDetail(FIXTURE_HTML);
    assert.deepEqual(detail.projections.appearances, {raw: "30+", min: 30, max: null, openEnded: true, ambiguity: null});
    assert.deepEqual(detail.projections.goals, {raw: "4/7", min: 4, max: 7, openEnded: false, ambiguity: null});
    assert.deepEqual(detail.projections.assists, {raw: "3/5", min: 3, max: 5, openEnded: false, ambiguity: null});
});

test("parser v2 extracts season history and maps the 'nd' sentinel to null, keeping appearances", function () {
    const detail = parseFpediaPlayerDetail(FIXTURE_HTML);
    assert.deepEqual(detail.history, [
        {season: "2025-2026", averageVote: 7.3, appearances: 35},
        {season: "2024-2025", averageVote: 6.89, appearances: 33},
        {season: "2023-2024", averageVote: null, appearances: 0}
    ]);
});

test("parser v2 extracts the current-season block including the distributed average", function () {
    const detail = parseFpediaPlayerDetail(FIXTURE_HTML);
    assert.deepEqual(detail.currentSeason, {season: "2025-2026", appearances: 35, fantasyAverage: 7.3, distributedAverage: 6.72});
});

test("parser v2 maps the '0.00' fantasy-average sentinel to null (foreign-league appearances case)", function () {
    const fixture = FIXTURE_HTML
        .replace("<span class=\"stickdan fondocobalto\"> 7.30</span>", "<span class=\"stickdan fondocobalto\"> 0.00</span>")
        .replace("<span class=\"stickdan fondocobalto\"> 6.72</span>", "<span class=\"stickdan fondocobalto\"> 0.00</span>");
    const detail = parseFpediaPlayerDetail(fixture);
    assert.equal(detail.currentSeason.fantasyAverage, null);
    assert.equal(detail.currentSeason.distributedAverage, null);
    assert.equal(detail.currentSeason.appearances, 35); // appearances survive the sentinel
});

test("parser v2 collects range ambiguities instead of silently correcting them", function () {
    const fixture = FIXTURE_HTML.replace("Gol previsti:</strong> 4/7 (range)", "Gol previsti:</strong> 7/4 (range)");
    const detail = parseFpediaPlayerDetail(fixture);
    assert.equal(detail.parsingAmbiguities.length, 1);
    assert.match(detail.parsingAmbiguities[0], /Gol previsti.*min>max/);
    assert.equal(detail.projections.goals.min, null);
});

test("parser v2 leaves existing v1 fields unchanged (backward compatibility)", function () {
    const detail = parseFpediaPlayerDetail(FIXTURE_HTML);
    assert.equal(detail.investmentSolidityPct, 80);
    assert.equal(detail.injuryResistancePct, 60);
    assert.deepEqual(detail.skills, ["Titolare", "Fuoriclasse"]);
    assert.equal(detail.flags.injured, false);
});

// ---- assessAlgorithmScoreUsability: ALG=0 sentinel semantics ----
const assessAlgorithmScoreUsability = require("../../src/sources/jobs/assessAlgorithmScoreUsability");

test("ALG raw 0 is a not-computed sentinel, never a usable score", function () {
    assert.deepEqual(assessAlgorithmScoreUsability(0), {status: "not_available", usable: null});
});

test("ALG raw >= 1 is available and usable as-is (26 is the real observed minimum)", function () {
    assert.deepEqual(assessAlgorithmScoreUsability(26), {status: "available", usable: 26});
    assert.deepEqual(assessAlgorithmScoreUsability(96), {status: "available", usable: 96});
});

test("ALG absent from the snapshot is unknown, distinct from not_available", function () {
    assert.deepEqual(assessAlgorithmScoreUsability(null), {status: "unknown", usable: null});
    assert.deepEqual(assessAlgorithmScoreUsability(undefined), {status: "unknown", usable: null});
});
