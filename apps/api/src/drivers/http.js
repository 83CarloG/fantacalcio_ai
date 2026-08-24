"use strict";
const path = require("node:path");
// __dirname-relative so this works both from the repo root and from `npm --workspace`
const config = require(path.resolve(__dirname, "..", "..", "config"));

/** Execute a public HTTP GET with a bounded timeout. */
module.exports = async function http(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {"user-agent": "FantaLuminous/0.1 (+personal fantasy-football research)", ...(options.headers || {})},
        signal: AbortSignal.timeout(config.httpTimeoutMs)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return {status: response.status, text: await response.text(), url: response.url};
};
