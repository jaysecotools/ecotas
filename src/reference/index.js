import { logger } from "../core/logger.js";

// Reference files are fetched once at startup and cached in memory. If a file
// is missing or fails to load, the app continues without it and logs a warning
// — no reference data is *required* for the app to function.
const CACHE = new Map();

export async function loadReference(name) {
  if (CACHE.has(name)) return CACHE.get(name);
  try {
    const res = await fetch(new URL(`./${name}.json`, import.meta.url));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    CACHE.set(name, json);
    return json;
  } catch (err) {
    logger.warn(`Reference "${name}" could not be loaded`, err);
    CACHE.set(name, { metadata: { title: name, caveat: "Unavailable" }, items: [] });
    return CACHE.get(name);
  }
}

export const REFERENCE_FILES = [
  "tas-weeds",
  "tas-vegetation",
  "tas-nrm-regions",
  "tas-threatened",
];
