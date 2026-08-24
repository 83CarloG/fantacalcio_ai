"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const weight=require("../../apps/api/src/indicators/jobs/calculateEarlySeasonWeight");
const reserve=require("../../apps/api/src/auction/jobs/calculateMinimumReserve");
// early weight is PV-based (matches with a vote / 5 planned pre-auction matchdays) — the
// old minutes-based formula is retired because minutes exist in no available source
test("established early-season cap is 25%",async()=>assert.equal(await weight({pv:5,isNewPlayer:false}),0.25));
test("new-player early-season cap is 35%",async()=>assert.equal(await weight({pv:9,isNewPlayer:true}),0.35));
test("early weight grows with rated appearances, never invented minutes",async()=>assert.equal(await weight({pv:2,isNewPlayer:false}),0.1));
test("auction reserve protects remaining slots",async()=>assert.equal(await reserve({remainingSlots:7,minimumPlayerPrice:1}),7));
