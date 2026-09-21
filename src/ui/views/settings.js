import { tx, STORE_NAMES } from "../../storage/db.js";
import { exportAll, downloadJSON } from "../../export/json.js";
import { toast } from "../toast.js";

let containerRef = null;

export async function mount({ container }) {
  containerRef = container;
  await render();
}

export function unmount() { containerRef = null; }

async function render() {
  const counts = {};
  for (const name of STORE_NAMES) {
    counts[name] = await tx(name, "readonly", (store) => new Promise((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  containerRef.innerHTML = `
    <header class="view-header"><h1>Settings</h1></header>

    <section class="panel">
      <h2>Storage</h2>
      <ul>
        ${Object.entries(counts).map(([k, v]) => `<li>${escape(k)}: ${v} records</li>`).join("")}
      </ul>
      <button class="btn btn-primary" id="btn-full-export">Download full backup (JSON)</button>
    </section>

    <section class="panel">
      <h2>Import</h2>
      <p>Restoring a backup will replace all records in the matching stores.</p>
      <input type="file" id="import-file" accept="application/json">
      <p class="help">Import is destructive and cannot be undone in Stage 2.</p>
    </section>

    <section class="panel">
      <h2>Danger zone</h2>
      <button class="btn btn-danger" id="btn-clear">Delete all local data</button>
      <p class="help">This removes every record from IndexedDB. There is no undo.</p>
    </section>
  `;

  containerRef.querySelector("#btn-full-export").addEventListener("click", async () => {
    const dump = await exportAll();
    downloadJSON(`ecotas-backup-${new Date().toISOString().slice(0, 10)}.json`, dump);
    toast("Backup downloaded", "success");
  });

  containerRef.querySelector("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let data;
    try { data = JSON.parse(text); } catch { toast("Invalid JSON", "error"); return; }
    if (!data.stores || typeof data.stores !== "object") { toast("Not an EcoTas backup", "error"); return; }
    if (!confirm("Replace all local data with the contents of this backup?")) return;
    for (const name of STORE_NAMES) {
      if (!Array.isArray(data.stores[name])) continue;
      await tx(name, "readwrite", (store) => {
        store.clear();
        for (const row of data.stores[name]) store.put(row);
      });
    }
    toast("Backup restored", "success");
    await render();
  });

  containerRef.querySelector("#btn-clear").addEventListener("click", async () => {
    if (!confirm("Delete ALL local data? This cannot be undone.")) return;
    for (const name of STORE_NAMES) {
      await tx(name, "readwrite", (store) => store.clear());
    }
    toast("All local data deleted", "info");
    await render();
  });
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
