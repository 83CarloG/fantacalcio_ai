"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// This file exercises real DB-touching lifecycle jobs (identity overrides, player
// removal/reappearance, dataset snapshot immutability) end to end against a throwaway
// SQLite file — the only place in this codebase such coverage exists, since every other
// unit test here is pure. SQLITE_FILE must be set before the first `require` of
// src/drivers/database.js anywhere in this process, since the connection is a module-level
// singleton (see src/drivers/database.js) — no other test file in this suite touches the DB.
const dbFile = path.join(os.tmpdir(), `fanta-lifecycle-test-${process.pid}.sqlite`);
process.env.SQLITE_FILE = dbFile;
process.env.DATABASE_KIND = "sqlite";

const apiRoot = path.resolve(__dirname, "..", "..");
const database = require(path.join(apiRoot, "src/drivers/database"));

test.before(function () {
    const dbDir = path.join(apiRoot, "db");
    const db = database();
    for (const file of fs.readdirSync(dbDir).filter((f) => f.endsWith(".sql")).sort()) {
        const sql = fs.readFileSync(path.join(dbDir, file), "utf8");
        const withoutComments = sql.split("\n").filter((line) => !line.trim().startsWith("--")).join("\n");
        for (const statement of withoutComments.split(";").map((s) => s.trim()).filter(Boolean)) {
            try { db.exec(`${statement};`); } catch (error) { if (!/duplicate column name/i.test(error.message)) throw error; }
        }
    }
});

test.after(function () { fs.rmSync(dbFile, {force: true}); });

const upsertPlayerRecord = require(path.join(apiRoot, "src/sources/jobs/upsertPlayerRecord"));
const upsertPlayerIdentity = require(path.join(apiRoot, "src/sources/jobs/upsertPlayerIdentity"));
const markPlayersRemoved = require(path.join(apiRoot, "src/sources/jobs/markPlayersRemoved"));
const upsertFpediaSyncState = require(path.join(apiRoot, "src/sources/jobs/upsertFpediaSyncState"));
const createDatasetSnapshot = require(path.join(apiRoot, "src/snapshots/services/createDatasetSnapshot"));
const getDatasetSnapshot = require(path.join(apiRoot, "src/snapshots/services/getDatasetSnapshot"));
const recordPlayerSnapshot = require(path.join(apiRoot, "src/sources/jobs/recordPlayerSnapshot"));
const getPlayerIndicators = require(path.join(apiRoot, "src/indicators/services/getPlayerIndicators"));

function samplePlayer(id, overrides = {}) {
    return {fantacalcioPlayerId: id, name: "Test P.", team: "Test", role: "C", quotationClassic: 1, fvmClassic: 1, quotationMantra: 1, fvmMantra: 1, ...overrides};
}

test("a manual override is never replaced by a later automatic identity match", async function () {
    await upsertPlayerRecord(samplePlayer(9001));
    await upsertPlayerIdentity({playerId: 9001, source: "fpedia", sourceId: "1", sourceUrl: "https://example.test/1", rawName: "OVERRIDE NAME", fullName: "Override Name", matchMethod: "manual_override"});
    await upsertPlayerIdentity({playerId: 9001, source: "fpedia", sourceId: "2", sourceUrl: "https://example.test/2", rawName: "AUTO NAME", fullName: "Auto Name", matchMethod: "deterministic"});

    const row = database().prepare("SELECT full_name FROM players WHERE player_id = ?").get(9001);
    assert.equal(row.full_name, "Override Name");
    const identity = database().prepare("SELECT source_id FROM player_source_identities WHERE player_id = ? AND source = 'fpedia'").get(9001);
    assert.equal(identity.source_id, "1");
});

test("a player missing from a new listone import is marked REMOVED, not deleted", async function () {
    await upsertPlayerRecord(samplePlayer(9002));
    await markPlayersRemoved([]); // 9002 not present in this import's id list
    const row = database().prepare("SELECT status FROM players WHERE player_id = ?").get(9002);
    assert.equal(row.status, "REMOVED");
});

test("a previously-removed player becomes ACTIVE again once it reappears in the listone", async function () {
    await upsertPlayerRecord(samplePlayer(9003));
    await markPlayersRemoved([]);
    assert.equal(database().prepare("SELECT status FROM players WHERE player_id = ?").get(9003).status, "REMOVED");
    await upsertPlayerRecord(samplePlayer(9003));
    assert.equal(database().prepare("SELECT status FROM players WHERE player_id = ?").get(9003).status, "ACTIVE");
});

test("upsertFpediaSyncState counts attempts across repeated failures", async function () {
    await upsertPlayerRecord(samplePlayer(9004));
    await upsertFpediaSyncState({playerId: 9004, status: "FAILED_RETRYABLE", error: "HTTP 503", backoffMs: 1000});
    await upsertFpediaSyncState({playerId: 9004, status: "FAILED_RETRYABLE", error: "HTTP 503", backoffMs: 1000});
    const row = database().prepare("SELECT attempts, status FROM player_source_sync_state WHERE player_id = ?").get(9004);
    assert.equal(row.attempts, 2);
    assert.equal(row.status, "FAILED_RETRYABLE");
});

test("a dataset snapshot is immutable: later changes to a player don't affect an already-created snapshot", async function () {
    await upsertPlayerRecord(samplePlayer(9005, {fvmClassic: 100}));
    const created = await createDatasetSnapshot({type: "POST_MARKET_BASELINE", label: `test-baseline-${process.pid}`});
    await upsertPlayerRecord(samplePlayer(9005, {fvmClassic: 999}));

    const snapshot = await getDatasetSnapshot(created.datasetSnapshotId);
    const pinnedPlayer = snapshot.players.find((p) => p.playerId === 9005);
    assert.equal(pinnedPlayer.payload.player.fvm_classic, 100);
    assert.equal(database().prepare("SELECT fvm_classic FROM players WHERE player_id = ?").get(9005).fvm_classic, 999);
});

test("v2 relative value uses demand-based replacement, not the role median", async function () {
    // role "A" is unused by every other test in this file, so this pool is fully isolated
    // regardless of test execution order. Peers: 50 / 70 / 90; role-A demand (48) exceeds the
    // pool size, so the replacement is the LAST ranked player (50), not the median (70).
    for (const [id, score] of [[9101, 50], [9102, 70], [9103, 90]]) {
        await upsertPlayerRecord(samplePlayer(id, {role: "A"}));
        await recordPlayerSnapshot({playerId: id, snapshotType: "FPEDIA_REFRESH", payload: {sources: {fpedia: {data: {algorithmScore: score}}}}});
    }

    const bottom = await getPlayerIndicators({playerId: 9101});
    assert.equal(bottom.relativeValue.replacementScore, 50);
    assert.equal(bottom.relativeValue.vorp, 0);
    assert.equal(bottom.technical.scarcityIndex, 0);
    assert.equal(bottom.relativeValue.roleRank, 3);

    const top = await getPlayerIndicators({playerId: 9103});
    assert.equal(top.relativeValue.vorp, 40);
    assert.equal(top.technical.scarcityIndex, 100); // vorp 40 caps at 100, no alternatives within 5
    assert.equal(top.relativeValue.roleRank, 1);
});

test("a lone role player IS the replacement: vorp and scarcity are 0, not null", async function () {
    await upsertPlayerRecord(samplePlayer(9201, {role: "D"})); // role "D" unused elsewhere in this file
    await recordPlayerSnapshot({playerId: 9201, snapshotType: "FPEDIA_REFRESH", payload: {sources: {fpedia: {data: {algorithmScore: 75}}}}});
    const indicators = await getPlayerIndicators({playerId: 9201});
    assert.equal(indicators.relativeValue.vorp, 0);
    assert.equal(indicators.technical.scarcityIndex, 0);
});

test("early-season evidence UPDATES the preseason prior, capped and PV-weighted", async function () {
    // role "A" pool from the relative-value test above (9101=50, 9102=70, 9103=90).
    // Give 9101 three rated matches with the best FM in the role: weight = 0.25×(3/5)=0.15
    // (established: it has an algorithmScore-only snapshot but no fantavoto history → cap
    // 0.35, weight 0.35×0.6=0.21), early score = top FM percentile.
    const upsertSeasonStatSnapshot = require(path.join(apiRoot, "src/sources/jobs/upsertSeasonStatSnapshot"));
    await upsertSeasonStatSnapshot({playerId: 9101, asOfMatchday: 3, pv: 3, mv: 6.5, fm: 8.5, gol: 3, gs: 0, rigRaw: null, rp: 0, ass: 1, amm: 0, esp: 0, penaltiesRaw: null});
    await upsertSeasonStatSnapshot({playerId: 9102, asOfMatchday: 3, pv: 3, mv: 6.0, fm: 6.0, gol: 0, gs: 0, rigRaw: null, rp: 0, ass: 0, amm: 0, esp: 0, penaltiesRaw: null});

    const indicators = await getPlayerIndicators({playerId: 9101});
    assert.equal(indicators.technical.preseasonScore, 50);
    assert.ok(indicators.technical.earlySeasonWeight > 0, "weight must grow with PV");
    assert.ok(indicators.technical.earlySeasonWeight <= 0.35, "cap must hold");
    assert.ok(indicators.technical.earlySeasonScore > 50, "top FM in role → high early score");
    const technical = indicators.technical.technicalProjectionScore;
    assert.ok(technical > 50 && technical < indicators.technical.earlySeasonScore,
        `blend ${technical} must move toward the evidence without replacing the prior`);

    // cleanup so the earlier relative-value expectations stay valid for reruns
    database().prepare("DELETE FROM season_stat_snapshots").run();
});

test("the Cömert case: ALG raw 0 + FCP present must NOT collapse the technical score to 0", async function () {
    await upsertPlayerRecord(samplePlayer(9301, {role: "P"})); // role "P" unused elsewhere in this file
    await recordPlayerSnapshot({playerId: 9301, snapshotType: "FPEDIA_REFRESH", payload: {sources: {fpedia: {data: {
        algorithmScore: 0, editorialFcpScore: 61, skills: [], flags: {injured: false}
    }}}}});
    const indicators = await getPlayerIndicators({playerId: 9301});
    assert.equal(indicators.technical.algorithmScoreRaw, 0);           // raw preserved
    assert.equal(indicators.technical.algorithmScoreStatus, "not_available");
    assert.equal(indicators.technical.ensembleSource, "fcp_only");
    assert.equal(indicators.technical.technicalProjectionScore, 61);   // FCP drives the prior
    // trust is reduced but not destroyed: single signal (15) + no history (20) +
    // projections missing (15) → confidenceScore 50, never "high"
    assert.equal(indicators.uncertainty.confidenceScore, 50);
    assert.notEqual(indicators.confidence, "high");
});
