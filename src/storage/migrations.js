// Migrations are recorded in the meta store. Each migration has a version
// and an async up(db) function. Runs are idempotent.
import { tx } from "./db.js";
import { logger } from "../core/logger.js";

export const MIGRATIONS = [
  {
    version: 1,
    async up() {
      // Initial schema (v1): nothing to do beyond creating stores,
      // which openIDB handles in onupgradeneeded.
    },
  },
  {
    version: 2,
    async up() {
      // Add "zones" store relationship to sites via index. IndexedDB
      // creates indexes declaratively, so nothing to do here beyond
      // ensuring existing sites have a zones array.
      await tx("sites", "readwrite", (store) => {
        const req = store.getAll();
        req.onsuccess = () => {
          for (const site of req.result) {
            if (!Array.isArray(site.zoneIds)) site.zoneIds = [];
            store.put(site);
          }
        };
      });
    },
  },
  {
    version: 3,
    async up() {
      // Nothing structural. Reserved for future.
    },
  },
];

export async function runMigrations() {
  const applied = await tx("meta", "readonly", (store) => {
    const req = store.get("migrations");
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result ? req.result.value : 0);
    });
  });

  for (const m of MIGRATIONS) {
    if (m.version <= applied) continue;
    logger.info(`Applying migration v${m.version}`);
    await m.up();
    await tx("meta", "readwrite", (store) => {
      store.put({ key: "migrations", value: m.version });
    });
  }
}
