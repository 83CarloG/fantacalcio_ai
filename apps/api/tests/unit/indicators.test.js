"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const weight = require("../../src/indicators/jobs/calculateEarlySeasonWeight");
const technical = require("../../src/indicators/jobs/calculateTechnicalScore");

test("early season evidence is capped for established players (PV-based, no minutes)", async function () {
    assert.equal(await weight({pv: 5, isNewPlayer: false}), 0.25);
    assert.equal(await weight({pv: 12, isNewPlayer: false}), 0.25); // cap holds beyond the window
});

test("early weight is 0 with no rated appearances yet", async function () {
    assert.equal(await weight({pv: 0, isNewPlayer: false}), 0);
    assert.equal(await weight({}), 0);
});

test("newcomer cap is 35% and partial evidence scales linearly", async function () {
    assert.equal(await weight({pv: 5, isNewPlayer: true}), 0.35);
    assert.equal(await weight({pv: 1, isNewPlayer: true}), 0.07);
});

test("technical score blends prior and early sample", async function () {
    assert.equal(await technical({preseasonScore: 80, earlySeasonScore: 100, earlySeasonWeight: 0.25}), 85);
});
