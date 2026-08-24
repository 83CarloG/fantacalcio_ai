"use strict";
const fs = require("node:fs");
const path = require("node:path");
const database = require("../src/drivers/database");

const dbDir = path.resolve(__dirname, "..", "db");
// Numeric filename prefix (001_, 002_, ...) fixes the apply order.
const migrationFiles = fs.readdirSync(dbDir).filter((file) => file.endsWith(".sql")).sort();

const db = database();
for (const file of migrationFiles) {
    const rawSql = fs.readFileSync(path.join(dbDir, file), "utf8");
    // Strip full-line `--` comments before splitting on `;`, so a semicolon inside a
    // comment sentence can't be mistaken for a statement boundary.
    const sql = rawSql.split("\n").filter((line) => !line.trim().startsWith("--")).join("\n");
    // Run statement-by-statement (not one db.exec(sql) call) so a re-run stays idempotent
    // even for `ALTER TABLE ... ADD COLUMN`, which SQLite has no IF NOT EXISTS guard for.
    const statements = sql.split(";").map((statement) => statement.trim()).filter(Boolean);
    for (const statement of statements) {
        try {
            db.exec(`${statement};`);
        } catch (error) {
            if (!/duplicate column name/i.test(error.message)) throw error;
        }
    }
}
console.log(`API migrations applied (${migrationFiles.join(", ")})`);
