"use strict";
const enrichFpediaBatch = require("../features/enrichFpediaBatch");
const getFpediaSyncStatusCounts = require("../jobs/getFpediaSyncStatusCounts");

module.exports = {
    full: () => enrichFpediaBatch("full"),
    stale: () => enrichFpediaBatch("stale"),
    retryFailed: () => enrichFpediaBatch("retry-failed"),
    force: () => enrichFpediaBatch("force"),
    status: () => getFpediaSyncStatusCounts()
};
