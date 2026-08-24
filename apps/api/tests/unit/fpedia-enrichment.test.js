"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const classifyFpediaFetchError = require("../../src/sources/jobs/classifyFpediaFetchError");
const parseFpediaPlayerDetail = require("../../src/sources/jobs/parseFpediaPlayerDetail");

test("classifyFpediaFetchError treats a 404 as not-found, not retryable", function () {
    assert.equal(classifyFpediaFetchError(new Error("HTTP 404 for https://example.test")), "NOT_FOUND");
});

test("classifyFpediaFetchError treats 429/5xx as transient and retryable", function () {
    assert.equal(classifyFpediaFetchError(new Error("HTTP 429 for https://example.test")), "FAILED_RETRYABLE");
    assert.equal(classifyFpediaFetchError(new Error("HTTP 503 for https://example.test")), "FAILED_RETRYABLE");
});

test("classifyFpediaFetchError treats a timeout as retryable", function () {
    const error = new Error("The operation was aborted");
    error.name = "TimeoutError";
    assert.equal(classifyFpediaFetchError(error), "FAILED_RETRYABLE");
});

test("classifyFpediaFetchError sends an unexpected error to manual review rather than guessing", function () {
    assert.equal(classifyFpediaFetchError(new Error("Unexpected token < in JSON")), "NEEDS_REVIEW");
});

// trimmed to the real markup shape observed on a live FPEDIA player detail page on 2026-08-10
const FIXTURE_HTML = `
<div class="col_one_fourth nobottommargin">
  <div class="label12">
    <strong>Algoritmo Fantacalciopedia</strong><br />
    <span class="stickdan fondocobalto"> 96<small>/100</small></span>
  </div>
</div>
<div class="col_one_fourth"><span class="stickdanpic">Titolare</span></div>
<div class="col_one_fourth"><span class="stickdanpic">Fuoriclasse</span></div>
<div class="topmargin font18">
  <div class="fancy-title title-bottom-border"><h2 class="panel-title">Riepilogo previsionali</h2></div>
  <strong>Solidità dell'investimento fantacalcistico:</strong> 4 su 5
  <br /><strong>Resistenza agli infortuni:</strong> 3 su 5
</div>
<nav>Lista infortunati Serie A</nav>
`;

test("parseFpediaPlayerDetail reads the algorithm score and converts X-su-5 ratings to a percentage", function () {
    const detail = parseFpediaPlayerDetail(FIXTURE_HTML);
    assert.equal(detail.algorithmScore, 96);
    assert.equal(detail.investmentSolidityPct, 80);
    assert.equal(detail.injuryResistancePct, 60);
});

test("parseFpediaPlayerDetail collects the skill tags", function () {
    const detail = parseFpediaPlayerDetail(FIXTURE_HTML);
    assert.deepEqual(detail.skills, ["Titolare", "Fuoriclasse"]);
});

test("parseFpediaPlayerDetail does not false-positive 'injured' from the site's global nav link", function () {
    // regression: an earlier version searched the whole page text for "infortunat..." and
    // matched the "Lista infortunati Serie A" nav link present on every page regardless of
    // whether the current player is actually injured
    const detail = parseFpediaPlayerDetail(FIXTURE_HTML);
    assert.equal(detail.flags.injured, false);
});
