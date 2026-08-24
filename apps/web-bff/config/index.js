"use strict";
module.exports = {
    host: process.env.WEB_HOST || "0.0.0.0",
    port: Number(process.env.WEB_PORT || 3001),
    apiBaseUrl: process.env.API_BASE_URL || "http://127.0.0.1:3000"
};
