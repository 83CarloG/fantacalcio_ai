"use strict";
const fs = require("node:fs");
const path = require("node:path");
const database = require("../src/drivers/database");
const db = database();
const root = path.resolve(__dirname, "..", "..", "..");
const snapshots = JSON.parse(fs.readFileSync(path.resolve(root, "data/samples/player-snapshots.json"), "utf8"));
const transactionsRaw = JSON.parse(fs.readFileSync(path.resolve(root, "data/reference/auction-transactions-2025-26.json"), "utf8"));
const model = JSON.parse(fs.readFileSync(path.resolve(root, "data/reference/league-market-model-2025-26.json"), "utf8"));
const list = Array.isArray(snapshots) ? snapshots : (snapshots.players || []);
const txs = Array.isArray(transactionsRaw) ? transactionsRaw : (transactionsRaw.transactions || transactionsRaw.data || []);

db.exec("DELETE FROM player_snapshots");

const upsertPlayer = db.prepare("INSERT OR REPLACE INTO players(player_id,name,team,role,quotation_classic,fvm_classic,quotation_mantra,fvm_mantra) VALUES(?,?,?,?,?,?,?,?)");
const insertSnapshot = db.prepare("INSERT INTO player_snapshots(player_id,observed_at,payload_json) VALUES(?,?,?)");
for (const snapshot of list) {
    const playerId = snapshot.player?.sourceIds?.fantacalcio || snapshot.sources?.fantacalcio?.data?.playerId || snapshot.sourceIdentities?.fantacalcio?.playerId;
    if (!Number.isFinite(Number(playerId))) continue;
    const name = snapshot.player?.canonicalName || snapshot.player?.name || "Unknown";
    const team = snapshot.player?.team || snapshot.team?.canonicalName || snapshot.sources?.fantacalcio?.data?.team || null;
    const role = (snapshot.player?.roles?.classic && snapshot.player.roles.classic[0]) || (snapshot.roles?.classic && snapshot.roles.classic[0]) || snapshot.sources?.fantacalcio?.data?.role || null;
    // same quotation/FVM shape the bulk listone importer writes, kept consistent for the 3 sample players
    const quotations = snapshot.sources?.fantacalcio?.data?.quotations || {};
    const fvm = snapshot.sources?.fantacalcio?.data?.fvmPer1000 || {};
    upsertPlayer.run(Number(playerId), name, team, role, quotations.classic ?? null, fvm.classic ?? null, quotations.mantra ?? null, fvm.mantra ?? null);
    insertSnapshot.run(Number(playerId), snapshot.collectedAt || snapshot.sources?.fantacalcio?.evidence?.observedAt || new Date().toISOString(), JSON.stringify(snapshot));
}

db.exec("DELETE FROM auction_transactions");
const insertTx = db.prepare("INSERT INTO auction_transactions(season,player_id,player_name,role,manager_id,price,payload_json) VALUES(?,?,?,?,?,?,?)");
for (const tx of txs) {
    const price = tx.price?.credits ?? tx.price ?? tx.auctionPrice ?? tx.cost;
    const name = tx.player?.name ?? tx.playerName ?? tx.name ?? "Unknown";
    const playerId = tx.player?.fantacalcioPlayerId ?? tx.fantacalcioPlayerId ?? tx.playerId ?? null;
    const role = tx.player?.role ?? tx.role ?? null;
    const managerId = tx.buyer?.managerId ?? tx.managerId ?? tx.owner ?? tx.buyer ?? null;
    if (price == null) continue;
    insertTx.run("2025-26", playerId == null ? null : Number(playerId), name, role, managerId, Number(price), JSON.stringify(tx));
}

db.exec("DELETE FROM market_models");
db.prepare("INSERT INTO market_models(model_version,created_at,payload_json) VALUES(?,?,?)").run(model.modelVersion || model.version || "market-2025-26", new Date().toISOString(), JSON.stringify(model));
console.log(`Seeded ${list.length} snapshots and ${txs.length} auction rows`);
