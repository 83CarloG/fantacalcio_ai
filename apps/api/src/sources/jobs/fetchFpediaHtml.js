"use strict";
const http = require("../../drivers/http");
module.exports = async function fetchFpediaHtml(url) { return http(url); };
