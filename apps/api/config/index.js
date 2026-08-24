"use strict";
const path = require("node:path");
module.exports = {
    host: process.env.API_HOST || "0.0.0.0",
    port: Number(process.env.API_PORT || 3000),
    databaseKind: process.env.DATABASE_KIND || "sqlite",
    // resolved from this file's location (not cwd) so it is correct whether invoked
    // from the repo root (bootstrap.sh, Docker) or via `npm --workspace` (cwd = apps/api)
    sqliteFile: path.resolve(__dirname, "..", "..", "..", process.env.SQLITE_FILE || "runtime/fanta.sqlite"),
    redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    // the Fantacalcio.it listone page is ~1MB in one response; 10s cut it close on a slow link
    httpTimeoutMs: Number(process.env.HTTP_TIMEOUT_MS || 20000)
};
