"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const median = require("../../src/shared/median");

test("median of an odd-length array is the middle value", function () {
    assert.equal(median([3, 1, 2]), 2);
});

test("median of an even-length array averages the two middle values", function () {
    assert.equal(median([1, 2, 3, 4]), 2.5);
});

test("median of a single value is itself", function () {
    assert.equal(median([7]), 7);
});

test("median of an empty array is null, not NaN or 0", function () {
    assert.equal(median([]), null);
});

test("median does not mutate the input array", function () {
    const input = [3, 1, 2];
    median(input);
    assert.deepEqual(input, [3, 1, 2]);
});
