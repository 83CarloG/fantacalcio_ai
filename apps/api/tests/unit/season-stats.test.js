"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const parseFantacalcioSeasonStats = require("../../src/sources/jobs/parseFantacalcioSeasonStats");

// trimmed to the real markup shape observed on https://www.fantacalcio.it/statistiche-serie-a
// on 2026-08-10 (tr.player-row with data-col-key cells; Italian decimal commas; the
// data-penalties row attribute) — values made non-zero to exercise the parsing
const FIXTURE_HTML = `
<table><tbody>
    <tr class="player-row" data-index="0" data-penalties="1.0" data-filter-team-id="1" data-filter-role-classic="c">
        <th class="player-name"><a class="player-name player-link" href="https://www.fantacalcio.it/serie-a/squadre/como/paz-n/6875"><span>Paz N.</span></a></th>
        <td class="player-team" data-col-key="sq">COM</td>
        <td class="player-match-playeds" data-col-key="pg">3</td>
        <td class="player-grade-avg" data-col-key="mv">6,83</td>
        <td class="player-fanta-grade-avg" data-col-key="mfv">8,17</td>
        <td data-col-key="gol">2</td>
        <td data-col-key="gs">0</td>
        <td data-col-key="rig">1/1</td>
        <td data-col-key="rp">0</td>
        <td data-col-key="ass">1</td>
        <td data-col-key="amm">1</td>
        <td data-col-key="esp">0</td>
    </tr>
    <tr class="player-row" data-index="1" data-filter-team-id="2" data-filter-role-classic="p">
        <th class="player-name"><a class="player-name player-link" href="https://www.fantacalcio.it/serie-a/squadre/atalanta/carnesecchi/4431"><span>Carnesecchi</span></a></th>
        <td data-col-key="sq">ATA</td>
        <td data-col-key="pg">0</td>
        <td data-col-key="mv">0,0</td>
        <td data-col-key="mfv">0,0</td>
        <td data-col-key="gol">0</td>
        <td data-col-key="gs">0</td>
        <td data-col-key="rig"></td>
        <td data-col-key="rp">0</td>
        <td data-col-key="ass">0</td>
        <td data-col-key="amm">0</td>
        <td data-col-key="esp">0</td>
    </tr>
</tbody></table>
`;

test("season stats parser joins on the canonical fantacalcioPlayerId from the href", function () {
    const rows = parseFantacalcioSeasonStats(FIXTURE_HTML);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].fantacalcioPlayerId, 6875);
    assert.equal(rows[1].fantacalcioPlayerId, 4431);
});

test("season stats parser handles Italian decimal commas", function () {
    const rows = parseFantacalcioSeasonStats(FIXTURE_HTML);
    assert.equal(rows[0].mv, 6.83);
    assert.equal(rows[0].fm, 8.17);
});

test("rig and data-penalties stay RAW strings until their semantics are verified at G1", function () {
    const rows = parseFantacalcioSeasonStats(FIXTURE_HTML);
    assert.equal(rows[0].rigRaw, "1/1");   // never parsed into a guessed scored/attempted split
    assert.equal(rows[0].penaltiesRaw, "1.0");
    assert.equal(rows[1].rigRaw, null);    // blank cell → null, not empty string
});

test("a row with no resolvable player id is skipped, not guessed", function () {
    const rows = parseFantacalcioSeasonStats('<tr class="player-row"><th class="player-name"></th></tr>');
    assert.equal(rows.length, 0);
});
