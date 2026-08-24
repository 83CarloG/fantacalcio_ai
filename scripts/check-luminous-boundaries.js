"use strict";
const fs = require("node:fs");
const path = require("node:path");
const roots = [path.resolve("apps/api/src"), path.resolve("apps/web-bff/src")];
const layers = ["services","features","operations","jobs","drivers"];
const violations = [];
function files(dir){ return fs.existsSync(dir) ? fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]) : []; }
function layerOf(file){ return layers.find(l=>file.split(path.sep).includes(l)) || null; }
function rank(layer){ return {services:5,features:4,operations:3,jobs:2,drivers:1}[layer] || 0; }
for(const root of roots){
  for(const file of files(root).filter(f=>f.endsWith(".js"))){
    const source=fs.readFileSync(file,"utf8");
    if(/fastify|handlebars|request\.params|reply\./i.test(source)) violations.push(`${file}: framework concern inside src`);
    const current=layerOf(file); if(!current) continue;
    for(const match of source.matchAll(/require\(["']([^"']+)["']\)/g)){
      const spec=match[1]; if(!spec.startsWith(".")) continue;
      const target=path.resolve(path.dirname(file),spec); const targetLayer=layerOf(target); if(!targetLayer) continue;
      if(targetLayer===current) violations.push(`${file}: same-layer call ${current} -> ${targetLayer}`);
      if(rank(targetLayer)>rank(current)) violations.push(`${file}: upward call ${current} -> ${targetLayer}`);
      if(current==="operations" && targetLayer!=="jobs") violations.push(`${file}: operation may call jobs only`);
    }
  }
}
if(violations.length){ console.error(violations.join("\n")); process.exit(1); }
console.log("Luminous boundary check passed");
