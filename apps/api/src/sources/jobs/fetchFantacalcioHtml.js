"use strict";
const http = require("../../drivers/http");
module.exports = async function fetchFantacalcioHtml(url) { return http(url); };
