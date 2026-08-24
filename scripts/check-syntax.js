"use strict";
const fs = require("node:fs");
const path = require("node:path");
const {spawnSync} = require("node:child_process");
const roots=["apps/api","apps/web-bff","packages/design-system","scripts","tests"];
function files(dir){return fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]):[];}
let failed=false;
for(const file of roots.flatMap(files).filter(f=>f.endsWith(".js"))){ const r=spawnSync(process.execPath,["--check",file],{stdio:"pipe"}); if(r.status!==0){failed=true;console.error(file);console.error(r.stderr.toString());}}
if(failed)process.exit(1); console.log("JavaScript syntax check passed");
