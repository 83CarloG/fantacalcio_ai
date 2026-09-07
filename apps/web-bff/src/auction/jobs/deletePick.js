"use strict";
const backendApi = require("../../drivers/backendApi");

module.exports = async function deletePick(id) {
    return backendApi({method: "DELETE", pathname: `/v1/auction/picks/${encodeURIComponent(id)}`});
};
