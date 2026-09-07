"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const predictPrice = require("../../src/market/jobs/predictPrice");

const MODEL = {roles: {C: {intercept: 2, slope: 0.5, mae: 3}}};

test("a missing FVM returns a null price, never a value guessed from the role average alone", async function () {
    // fvm_classic is a nullable listone column (a blank pricing cell parses as null) — this
    // must not be silently treated as a real "0 quotation" (see buildPlayerIndicators.js).
    const result = await predictPrice({role: "C", fvm: null, model: MODEL});
    assert.equal(result.expectedPrice, null);
    assert.equal(result.reason, "missing_fvm");
});

test("a real FVM of 0 is still a real value and produces a real price", async function () {
    const result = await predictPrice({role: "C", fvm: 0, model: MODEL});
    assert.notEqual(result.expectedPrice, null);
    assert.equal(result.reason, undefined);
});

test("a missing role model returns a null price with its own distinct reason", async function () {
    const result = await predictPrice({role: "Z", fvm: 10, model: MODEL});
    assert.equal(result.expectedPrice, null);
    assert.equal(result.reason, "missing_role_model");
});
