"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const percentileRank = require("../../src/shared/percentileRank");
const calculatePreseasonEnsemble = require("../../src/indicators/jobs/calculatePreseasonEnsemble");
const calculateHistoricalMv = require("../../src/indicators/jobs/calculateHistoricalMv");
const calculateAvailabilityScore = require("../../src/indicators/jobs/calculateAvailabilityScore");
const calculateUpsideScore = require("../../src/indicators/jobs/calculateUpsideScore");
const calculateRiskProfile = require("../../src/indicators/jobs/calculateRiskProfile");
const calculateConfidenceProfile = require("../../src/indicators/jobs/calculateConfidenceProfile");
const calculateDefenseModifierValue = require("../../src/indicators/jobs/calculateDefenseModifierValue");
const calculateRelativeValue = require("../../src/indicators/jobs/calculateRelativeValue");

// ---- ensemble (approved checkpoint rules) ----

test("ensemble: both signals usable -> 50/50 mean, explicitly uncalibrated", function () {
    const result = calculatePreseasonEnsemble({editorialFcpScore: 82, algorithmUsable: 84});
    assert.equal(result.score, 83);
    assert.equal(result.source, "ensemble");
    assert.match(result.warnings[0], /uncalibrated/);
});

test("ensemble: FCP at floor (30) -> ALG only with warning", function () {
    const result = calculatePreseasonEnsemble({editorialFcpScore: 30, algorithmUsable: 71});
    assert.equal(result.score, 71);
    assert.equal(result.source, "alg_only");
    assert.equal(result.fcpAtFloor, true);
    assert.match(result.warnings[0], /floor/);
});

test("ensemble: ALG unusable -> FCP only (the Cömert rule)", function () {
    const result = calculatePreseasonEnsemble({editorialFcpScore: 61, algorithmUsable: null});
    assert.equal(result.score, 61);
    assert.equal(result.source, "fcp_only");
});

test("ensemble: strong disagreement keeps the mean but warns", function () {
    const result = calculatePreseasonEnsemble({editorialFcpScore: 52, algorithmUsable: 90});
    assert.equal(result.score, 71);
    assert.equal(result.disagreement, 38);
    assert.ok(result.warnings.some((w) => /disagree/.test(w)));
});

test("ensemble: nothing usable -> null score, never an invented neutral", function () {
    const result = calculatePreseasonEnsemble({editorialFcpScore: 30, algorithmUsable: null});
    assert.equal(result.score, null);
    assert.equal(result.source, "none");
});

// ---- role normalization ----

test("the same projected goals rank differently in different role distributions", function () {
    const defenderGoals = [0, 0, 0.5, 1, 1.5, 2, 3];   // 3 goals: near the top for a D
    const strikerGoals = [3, 5, 8, 10, 12, 15, 20];    // 3 goals: the bottom for an A
    assert.ok(percentileRank(3, defenderGoals) > 85);
    assert.ok(percentileRank(3, strikerGoals) < 15);
});

// ---- historical MV ----

test("a 30-appearance season outweighs a higher-MV 4-appearance one", function () {
    const result = calculateHistoricalMv([
        {season: "2025-2026", averageVote: 6.40, appearances: 30},
        {season: "2024-2025", averageVote: 6.60, appearances: 4}
    ]);
    assert.ok(Math.abs(result.weightedMv - 6.40) < Math.abs(result.weightedMv - 6.60));
});

test("no usable seasons -> weightedMv null, never 0/50/60", function () {
    const result = calculateHistoricalMv([{season: "2025-2026", averageVote: null, appearances: 29}]);
    assert.equal(result.weightedMv, null);
    assert.equal(result.hasHistory, false);
    assert.equal(result.maxAppearances, 29); // foreign-league appearances still tracked
});

// ---- availability / upside null semantics ----

test("availability is null with no projection and no role tags", function () {
    assert.equal(calculateAvailabilityScore({appearancesMid: null, skills: []}), null);
});

test("upside is null when no upside signal exists (established known quantity)", function () {
    assert.equal(calculateUpsideScore({skills: ["Titolare", "Buona Media"], projections: null}), null);
});

// ---- risk and confidence are independent by construction ----

test("high risk + high confidence: a well-documented fragile player", function () {
    const fullData = {
        ensembleSource: "ensemble", hasHistory: true, maxAppearances: 30,
        projections: {appearances: {min: 20, max: 25, openEnded: false}, goals: {}, assists: {}},
        editorialFcpScore: 70, algorithmUsable: 65, investmentSolidityPct: 60, injuryResistancePct: 20, skills: ["Titolare"]
    };
    const risk = calculateRiskProfile({injured: true, injuryResistancePct: 20, skills: ["Titolare"], appearancesMid: 22, hasHistory: true, maxAppearances: 30});
    const confidence = calculateConfidenceProfile(fullData);
    assert.ok(risk.riskScore > 40, `risk ${risk.riskScore} should be high`);
    assert.ok(confidence.confidenceScore >= 70, `confidence ${confidence.confidenceScore} should be high`);
});

test("low risk + low confidence: a safe-looking player with almost no evidence", function () {
    const thinData = {
        ensembleSource: "fcp_only", hasHistory: false, maxAppearances: 0,
        projections: null, editorialFcpScore: 70, algorithmUsable: null,
        investmentSolidityPct: null, injuryResistancePct: 80, skills: ["Titolare"]
    };
    const risk = calculateRiskProfile({injured: false, injuryResistancePct: 80, skills: ["Titolare"], appearancesMid: 30, hasHistory: true, maxAppearances: 30});
    const confidence = calculateConfidenceProfile(thinData);
    assert.ok(risk.riskScore < 30, `risk ${risk.riskScore} should be low`);
    // penalties: single signal (15) + no history (20) + projections missing (15) → 50
    assert.equal(confidence.confidenceScore, 50);
    assert.ok(confidence.penalties.length >= 3, "each evidence gap must be itemized");
});

test("dataCompleteness is mechanical and separate from confidence", function () {
    const result = calculateConfidenceProfile({
        ensembleSource: "ensemble", hasHistory: true, maxAppearances: 30,
        projections: {appearances: {}, goals: {}, assists: {}},
        editorialFcpScore: 70, algorithmUsable: 65, investmentSolidityPct: 60, injuryResistancePct: 60, skills: ["Titolare"]
    });
    assert.equal(result.dataCompleteness, 100);
});

// ---- defense modifier (informational, league thresholds) ----

test("defense modifier maps historical MV onto the league thresholds, P/D only", function () {
    assert.equal(calculateDefenseModifierValue({role: "D", weightedMv: 6.8}), 2);
    assert.equal(calculateDefenseModifierValue({role: "D", weightedMv: 5.9}), 0);
    assert.equal(calculateDefenseModifierValue({role: "C", weightedMv: 7.2}), null);
    assert.equal(calculateDefenseModifierValue({role: "D", weightedMv: null}), null);
});

// ---- relative value: demand-based replacement, VORP, tiers ----

function rolePool(scores) { return scores.map((score, i) => ({playerId: i + 1, score})); }

test("replacement is the demand-th ranked player, not the median", function () {
    const players = rolePool([90, 80, 70, 60, 50, 40, 30]);
    const result = calculateRelativeValue({playerId: 1, rolePlayers: players, demand: 3});
    assert.equal(result.replacementScore, 70); // 3rd ranked, while the median would be 60
    assert.equal(result.vorp, 20);
});

test("VORP below replacement is legitimately negative", function () {
    const players = rolePool([90, 80, 70, 60, 50]);
    const result = calculateRelativeValue({playerId: 5, rolePlayers: players, demand: 3});
    assert.equal(result.vorp, -20);
    assert.equal(result.scarcityIndex, 0); // floored at 0, but vorp keeps the information
});

test("scarcity is damped by the density of near-equal alternatives", function () {
    const isolated = calculateRelativeValue({playerId: 1, rolePlayers: rolePool([90, 60, 55, 50]), demand: 3});
    const crowded = calculateRelativeValue({playerId: 1, rolePlayers: rolePool([90, 89, 88, 50]), demand: 3});
    assert.ok(isolated.scarcityIndex > crowded.scarcityIndex);
});

test("tier detection is deterministic and splits at real cliffs", function () {
    const scores = [91, 89, 81, 80, 78, 60, 59]; // cliffs after 89 and after 78
    const players = rolePool(scores);
    const tierOf = (id) => calculateRelativeValue({playerId: id, rolePlayers: players, demand: 5}).tier;
    assert.equal(tierOf(1), 1);
    assert.equal(tierOf(2), 1);
    assert.equal(tierOf(3), 2);
    assert.equal(tierOf(5), 2);
    assert.equal(tierOf(6), 3);
    // deterministic: same input, same output
    assert.equal(tierOf(6), calculateRelativeValue({playerId: 6, rolePlayers: rolePool(scores), demand: 5}).tier);
});

test("a player with a null score gets null relative value, not a rank among the scored", function () {
    const players = [...rolePool([90, 80]), {playerId: 99, score: null}];
    const result = calculateRelativeValue({playerId: 99, rolePlayers: players, demand: 2});
    assert.equal(result.roleRank, null);
    assert.equal(result.vorp, null);
    assert.equal(result.scarcityIndex, null);
});

test("an undefined demand (role outside P/D/C/A) returns nulls instead of throwing", function () {
    // leagueRules.rosterDemand[role] is undefined for any role not in P/D/C/A — the `role`
    // column has no DB constraint, so this must degrade gracefully, not crash the whole
    // bulk recalculation loop.
    const result = calculateRelativeValue({playerId: 1, rolePlayers: rolePool([90, 80, 70]), demand: undefined});
    assert.equal(result.roleRank, null);
    assert.equal(result.vorp, null);
    assert.equal(result.scarcityIndex, null);
});

// ---- historical MV: recency weight follows the actual season gap, not array position ----

test("a gap year in history does not get the 'one year ago' weight", function () {
    // history has a hole (no 2024-25 season on record — injury/loan abroad/etc.): the
    // second entry is TWO years back from the most recent, not one, and must be weighted
    // accordingly rather than by its array position.
    const withGap = calculateHistoricalMv([
        {season: "2025-2026", averageVote: 6.00, appearances: 30},
        {season: "2023-2024", averageVote: 8.00, appearances: 30}
    ]);
    const noGap = calculateHistoricalMv([
        {season: "2025-2026", averageVote: 6.00, appearances: 30},
        {season: "2024-2025", averageVote: 8.00, appearances: 30}
    ]);
    // the two-years-back season must count for LESS than a one-year-back season would,
    // pulling the weighted average closer to the recent 6.00
    assert.ok(withGap.weightedMv < noGap.weightedMv);
});
