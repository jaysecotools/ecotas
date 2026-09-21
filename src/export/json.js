import { STORE_NAMES, tx } from "../storage/db.js";

export async function exportAll() {
  const dump = { app: "EcoTas", version: "0.2.0", exportedAt: new Date().toISOString(), stores: {} };
  for (const name of STORE_NAMES) {
    dump.stores[name] = await tx(name, "readonly", (store) => new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }
  return dump;
}

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
