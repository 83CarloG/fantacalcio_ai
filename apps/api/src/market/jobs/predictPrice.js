"use strict";
module.exports = async function predictPrice({role, fvm, model}) {
    const roleModel = model && model.priceModel && model.priceModel.roles ? model.priceModel.roles[role] : (model && model.roles ? model.roles[role] : null);
    if (!roleModel) return {expectedPrice: null, confidence: "low", reason: "missing_role_model"};
    // a missing FVM is not a real "0 quotation" — the listone column is nullable and a blank
    // pricing cell parses as null (see sources/jobs/parseFantacalcioListone.js). Defaulting
    // it to 0 would still produce a confident-looking price built from nothing but the
    // role's average intercept, with nothing distinguishing it from a real prediction.
    if (fvm === null || fvm === undefined) return {expectedPrice: null, confidence: "low", reason: "missing_fvm"};
    const intercept = Number(roleModel.intercept ?? roleModel.coefficients?.intercept ?? 0);
    const slope = Number(roleModel.slope ?? roleModel.coefficients?.fvm ?? 0);
    const expectedPrice = Math.max(1, intercept + slope * Number(fvm));
    const mae = Number(roleModel.mae ?? roleModel.metrics?.mae ?? 0);
    const p25 = Number(roleModel.residualBands?.p25 ?? -mae);
    const p75 = Number(roleModel.residualBands?.p75 ?? mae);
    return {
        expectedPrice: Number(expectedPrice.toFixed(2)),
        range: {low: Number(Math.max(1, expectedPrice + p25).toFixed(2)), high: Number(Math.max(1, expectedPrice + p75).toFixed(2))},
        confidence: "medium",
        calibration: "single-season-2025-26"
    };
};
