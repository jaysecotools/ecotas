import { test, assert } from "./run-helpers.js";
import fs from "node:fs";
import path from "node:path";

const REF_DIR = path.resolve("src/reference");
const FILES = ["tas-weeds.json", "tas-vegetation.json", "tas-nrm-regions.json", "tas-threatened.json"];

test("reference: all files present and valid JSON", () => {
  for (const f of FILES) {
    const p = path.join(REF_DIR, f);
    assert(fs.existsSync(p), `missing ${f}`);
    const json = JSON.parse(fs.readFileSync(p, "utf8"));
    assert(json.metadata && json.metadata.title, `${f} missing metadata.title`);
    assert(json.metadata.source, `${f} missing metadata.source`);
    assert(json.metadata.sourceDate, `${f} missing metadata.sourceDate`);
    assert(Array.isArray(json.items), `${f} missing items array`);
  }
});

test("reference: no duplicate scientific names in weed list", () => {
  const json = JSON.parse(fs.readFileSync(path.join(REF_DIR, "tas-weeds.json"), "utf8"));
  const seen = new Set();
  for (const item of json.items) {
    assert(!seen.has(item.scientificName), `duplicate: ${item.scientificName}`);
    seen.add(item.scientificName);
  }
});
