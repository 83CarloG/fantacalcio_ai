"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const normalizePlayerName = require("../../src/shared/normalizePlayerName");
const matchFpediaIdentity = require("../../src/sources/jobs/matchFpediaIdentity");
const resolveFullName = require("../../src/sources/jobs/resolveFullName");
const parseFpediaPlayerIndex = require("../../src/sources/jobs/parseFpediaPlayerIndex");

test("normalizePlayerName strips accents, case and punctuation", function () {
    assert.equal(normalizePlayerName("Nicolò Cambiaghi"), "nicolo cambiaghi");
    assert.equal(normalizePlayerName("Paz N."), "paz n");
    assert.equal(normalizePlayerName(null), "");
});

const FPEDIA_INDEX = [
    {fpediaId: 3803, fullName: "PAZ NICO", team: "Como", role: "C", url: "u1"},
    {fpediaId: 9999, fullName: "PAZ ANDREA", team: "Roma", role: "C", url: "u2"},
    {fpediaId: 3770, fullName: "DE GEA DAVID", team: "Fiorentina", role: "P", url: "u3"}
];

test("matchFpediaIdentity resolves an abbreviated 'Surname X.' against the initial", function () {
    const result = matchFpediaIdentity({name: "Paz N.", role: "C"}, FPEDIA_INDEX);
    assert.equal(result.status, "MATCHED");
    assert.equal(result.entry.fpediaId, 3803);
});

test("matchFpediaIdentity does not mistake a two-word surname for an abbreviation", function () {
    const result = matchFpediaIdentity({name: "De Gea", role: "P"}, FPEDIA_INDEX);
    assert.equal(result.status, "MATCHED");
    assert.equal(result.entry.fpediaId, 3770);
});

test("matchFpediaIdentity prefers a same-role candidate but falls back across roles since Fantacalcio.it, not FPEDIA's own index page, is the role source of truth", function () {
    // FPEDIA files "Paz Nico" under C; Fantacalcio.it's listone says A for this query —
    // same-role search finds nothing, so it must widen across roles rather than report
    // NOT_FOUND for a player FPEDIA genuinely has.
    const result = matchFpediaIdentity({name: "Paz N.", role: "A"}, FPEDIA_INDEX);
    assert.equal(result.status, "MATCHED");
    assert.equal(result.entry.fpediaId, 3803);
});

test("matchFpediaIdentity reports ambiguity rather than guessing between same-role candidates", function () {
    const result = matchFpediaIdentity({name: "Paz", role: "C"}, FPEDIA_INDEX);
    assert.equal(result.status, "AMBIGUOUS");
    assert.equal(result.candidates.length, 2);
});

test("matchFpediaIdentity does not let a surname match as a bare string-prefix of a different, longer surname", function () {
    // real false positive from the 2026-08 listone import: "Zappa" is a string-prefix of
    // "Zappacosta", so a plain startsWith() reported AMBIGUOUS between two different players.
    const index = [
        {fpediaId: 1, fullName: "ZAPPACOSTA DAVIDE", team: "Atalanta", role: "D", url: "u1"},
        {fpediaId: 2, fullName: "ZAPPA GABRIELE", team: "Cagliari", role: "D", url: "u2"}
    ];
    const result = matchFpediaIdentity({name: "Zappa", role: "D"}, index);
    assert.equal(result.status, "MATCHED");
    assert.equal(result.entry.fpediaId, 2);
});

test("resolveFullName reverses a 2-word FPEDIA 'SURNAME GIVENNAME' into natural order", function () {
    assert.equal(resolveFullName({fpediaFullName: "PAZ NICO"}), "Nico Paz");
});

test("resolveFullName leaves 3+ word FPEDIA names in source order rather than guessing the split", function () {
    assert.equal(resolveFullName({fpediaFullName: "DE GEA DAVID"}), "De Gea David");
});

test("resolveFullName falls back to the Fantacalcio.it detail-page name when given", function () {
    assert.equal(resolveFullName({fallbackName: "Nico Paz"}), "Nico Paz");
});

test("resolveFullName returns null when nothing was resolved", function () {
    assert.equal(resolveFullName({}), null);
});

const FPEDIA_INDEX_FIXTURE_HTML = `
<div class="col_full giocatore">
  <div class="fbox-icon"><a href="https://www.fantacalciopedia.com/lista-calciatori-serie-a/portieri/3770/de-gea-david.html"><img alt=""></a></div>
  <a href="https://www.fantacalciopedia.com/lista-calciatori-serie-a/portieri/3770/de-gea-david.html"><h3 class="tit_calc">DE GEA DAVID</h3></a>
  <p><span class="label label-warning">POR</span><small> Fiorentina</small></p>
</div>
<div class="col_full giocatore">
  <div class="fbox-icon"><a href="https://www.fantacalciopedia.com/lista-calciatori-serie-a/portieri/3342/carnesecchi-marco.html"><img alt=""></a></div>
  <a href="https://www.fantacalciopedia.com/lista-calciatori-serie-a/portieri/3342/carnesecchi-marco.html"><h3 class="tit_calc">CARNESECCHI MARCO</h3></a>
  <p><span class="label label-warning">POR</span><small> Atalanta</small></p>
</div>
`;

test("parseFpediaPlayerIndex parses every player card into a flat record", function () {
    const players = parseFpediaPlayerIndex(FPEDIA_INDEX_FIXTURE_HTML);
    assert.equal(players.length, 2);
    assert.deepEqual(players[0], {
        fpediaId: 3770,
        fullName: "DE GEA DAVID",
        team: "Fiorentina",
        roleLabel: "POR",
        url: "https://www.fantacalciopedia.com/lista-calciatori-serie-a/portieri/3770/de-gea-david.html"
    });
});
