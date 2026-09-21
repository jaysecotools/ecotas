import { logger } from "../core/logger.js";

const DB_NAME = "ecotas";
const DB_VERSION = 3;

const STORES = {
  meta:       { keyPath: "key" },
  projects:   { keyPath: "id", indexes: [["status"], ["updatedAt"]] },
  sites:      { keyPath: "id", indexes: [["projectId"], ["status"]] },
  zones:      { keyPath: "id", indexes: [["siteId"]] },
  species:    { keyPath: "id", indexes: [["siteId"], ["scientificName"], ["status"]] },
  observations: { keyPath: "id", indexes: [["siteId"], ["date"]] },
  assessments:  { keyPath: "id", indexes: [["siteId"], ["date"]] },
  maintenance:  { keyPath: "id", indexes: [["siteId"], ["status"], ["dueDate"]] },
  compliance:   { keyPath: "id", indexes: [["siteId"]] },
  auditLog:     { keyPath: "id", indexes: [["at"], ["entity"], ["entityId"]] },
};

let dbPromise = null;

function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const tx = request.transaction;
      for (const [name, def] of Object.entries(STORES)) {
        let store;
        if (!db.objectStoreNames.contains(name)) {
          store = db.createObjectStore(name, { keyPath: def.keyPath });
        } else {
          store = tx.objectStore(name);
        }
        if (def.indexes) {
          for (const [idxName] of def.indexes) {
            if (!store.indexNames.contains(idxName)) {
              store.createIndex(idxName, idxName, { unique: false });
            }
          }
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openMemory() {
  // Fallback: same interface, in-memory only.
  logger.warn("IndexedDB unavailable; using in-memory storage. Data will NOT persist.");
  const data = new Map();
  for (const name of Object.keys(STORES)) data.set(name, new Map());
  return {
    _memory: true,
    data,
  };
}

export async function open() {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === "undefined") {
    dbPromise = Promise.resolve(openMemory());
    return dbPromise;
  }
  dbPromise = openIDB().catch((err) => {
    logger.error("IndexedDB open failed; falling back to memory", err);
    return openMemory();
  });
  return dbPromise;
}

export async function tx(storeName, mode, fn) {
  const db = await open();
  if (db._memory) {
    // Emulate transaction semantics for the in-memory fallback.
    const map = db.data.get(storeName);
    return fn({
      get: (k) => map.get(k),
      put: (v) => { map.set(v[STORES[storeName].keyPath], v); },
      delete: (k) => map.delete(k),
      getAll: () => [...map.values()],
      clear: () => map.clear(),
    });
  }
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    let result;
    try {
      result = fn(store);
    } catch (err) {
      reject(err);
      return;
    }
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const STORE_NAMES = Object.keys(STORES);
