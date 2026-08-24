"use strict";
const path = require("node:path");
// __dirname-relative so this works both from the repo root and from `npm --workspace`
const config = require(path.resolve(__dirname, "..", "..", "config"));
module.exports = async function backendApi({method = "GET", pathname, body}) {
    const response = await fetch(`${config.apiBaseUrl}${pathname}`, {
        method,
        headers: body ? {"content-type": "application/json"} : undefined,
        body: body ? JSON.stringify(body) : undefined,
        // the listone import proxies a live ~1MB fetch + ~500 DB upserts on the API side;
        // everything else on this driver is a normal fast call, so one generous timeout is fine
        signal: AbortSignal.timeout(20000)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `API ${response.status}`);
    return payload.data;
};
