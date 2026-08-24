"use strict";
const path = require("node:path");
const createServer = require("./createServer");
// __dirname-relative so this works both from the repo root and from `npm --workspace`
const config = require(path.resolve(__dirname, "..", "config"));
(async function main() { const app = await createServer(); await app.listen({host: config.host, port: config.port}); })().catch(function (error) { console.error(error); process.exit(1); });
