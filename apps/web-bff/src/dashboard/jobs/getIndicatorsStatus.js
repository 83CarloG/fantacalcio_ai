"use strict";
const backendApi = require("../../drivers/backendApi");

/** Indicator-snapshot coverage of the active roster, for the dashboard setup checklist. */
module.exports = async function getIndicatorsStatus() {
    return backendApi({method: "GET", pathname: "/v1/indicators/status"});
};
