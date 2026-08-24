"use strict";
const collectFpediaPlayerIndex = require("../operations/collectFpediaPlayerIndex");

const FPEDIA_BASE = "https://www.fantacalciopedia.com/lista-calciatori-serie-a";
// Fantacalcio.it role code -> FPEDIA role-index path segment. Confirmed by inspecting the
// live site on 2026-08-10: each page lists every Serie A player for that role, unpaginated.
const ROLE_PATHS = {P: "portieri", D: "difensori", C: "centrocampisti", A: "attaccanti"};

/**
 * Fetch and merge all four FPEDIA role-index pages into one flat player index (id + full
 * name + team + role per player). Only 4 requests total — identity resolution does not need
 * to touch the ~500 individual detail pages that the deeper stat enrichment does.
 *
 * @return {Array<{fpediaId:number, fullName:string, team:?string, role:string, url:string}>}
 */
module.exports = async function buildFpediaPlayerIndex() {
    const entries = [];
    for (const [role, path] of Object.entries(ROLE_PATHS)) {
        const roleEntries = await collectFpediaPlayerIndex(`${FPEDIA_BASE}/${path}/`);
        for (const entry of roleEntries) entries.push({...entry, role});
    }
    return entries;
};
