"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
// __dirname-relative so this works both from the repo root and from `npm --workspace`
const config = require(path.resolve(__dirname, "..", "..", "config"));

let sqlite;

/** Return the configured database adapter. */
module.exports = function database() {
    if (config.databaseKind !== "sqlite") {
        throw new Error("MySQL runtime adapter is intentionally not enabled in MVP. Set DATABASE_KIND=sqlite.");
    }
    if (!sqlite) {
        fs.mkdirSync(path.dirname(config.sqliteFile), {recursive: true});
        sqlite = new DatabaseSync(config.sqliteFile);
        sqlite.exec("PRAGMA foreign_keys = ON");
    }
    return sqlite;
};
