"use strict";
let client;

/** Return an optional Redis client; callers may continue without cache. */
module.exports = async function cache() {
    if (client) return client;
    try {
        const {createClient} = require("redis");
        client = createClient({url: process.env.REDIS_URL || "redis://127.0.0.1:6379"});
        client.on("error", function () {});
        await client.connect();
        return client;
    } catch (_) {
        return null;
    }
};
