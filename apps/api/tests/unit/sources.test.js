"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const parseFantacalcioListone = require("../../src/sources/jobs/parseFantacalcioListone");

// trimmed to the real markup shape observed on https://www.fantacalcio.it/quotazioni-fantacalcio
// (team select + player rows with the data-* attributes the parser relies on)
const FIXTURE_HTML = `
<select id="team" name="team-id">
    <option class="placeholder" value="" selected>Squadra</option>
    <option value="153">Como</option>
    <option value="6">Fiorentina</option>
</select>
<table><tbody>
    <tr class="player-row" data-index="0" data-filter-team-id="153" data-filter-role-classic="c">
        <th class="player-name"><a class="player-name player-link" href="https://www.fantacalcio.it/serie-a/squadre/como/paz-n/6875"><span>Paz N.</span></a></th>
        <td class="player-team">COM</td>
        <td class="player-classic-current-price">21</td>
        <td class="player-classic-fvm">132</td>
        <td class="player-mantra-current-price">21</td>
        <td class="player-mantra-fvm">132</td>
    </tr>
    <tr class="player-row" data-index="1" data-filter-team-id="6" data-filter-role-classic="p">
        <th class="player-name"><a class="player-name player-link" href="https://www.fantacalcio.it/serie-a/squadre/fiorentina/de-gea/2521"><span>De Gea</span></a></th>
        <td class="player-team">FIO</td>
        <td class="player-classic-current-price"></td>
        <td class="player-classic-fvm"></td>
        <td class="player-mantra-current-price">14</td>
        <td class="player-mantra-fvm">64</td>
    </tr>
</tbody></table>
`;

test("parses every player row into a flat record with role and pricing", function () {
    const players = parseFantacalcioListone(FIXTURE_HTML);
    assert.equal(players.length, 2);
    assert.deepEqual(players[0], {
        fantacalcioPlayerId: 6875,
        name: "Paz N.",
        team: "Como",
        role: "C",
        quotationClassic: 21,
        fvmClassic: 132,
        quotationMantra: 21,
        fvmMantra: 132,
        fantacalcioUrl: "https://www.fantacalcio.it/serie-a/squadre/como/paz-n/6875"
    });
});

test("resolves the full team name via the team filter, not the abbreviated cell", function () {
    const players = parseFantacalcioListone(FIXTURE_HTML);
    assert.equal(players[1].team, "Fiorentina");
});

test("a blank pricing cell parses as null rather than NaN or 0", function () {
    const players = parseFantacalcioListone(FIXTURE_HTML);
    assert.equal(players[1].quotationClassic, null);
    assert.equal(players[1].fvmClassic, null);
});

test("a row with no resolvable player id is skipped, not guessed", function () {
    const players = parseFantacalcioListone('<tr class="player-row"><th class="player-name"></th></tr>');
    assert.equal(players.length, 0);
});
