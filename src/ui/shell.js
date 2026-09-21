import { exportAll, downloadJSON } from "../export/json.js";
import { toast } from "./toast.js";
import { router } from "./router.js";

export function mount({ appVersion }) {
  // Reflect the version in the UI so users and support can confirm it.
  const brand = document.querySelector(".brand");
  if (brand) brand.textContent = `EcoTas ${appVersion}`;

  document.getElementById("btn-export").addEventListener("click", async () => {
    try {
      const dump = await exportAll();
      downloadJSON(`ecotas-backup-${new Date().toISOString().slice(0, 10)}.json`, dump);
      toast("Backup downloaded", "success");
    } catch (err) {
      toast("Export failed: " + err.message, "error");
    }
  });

  document.getElementById("btn-settings").addEventListener("click", () => {
    router.navigate("settings");
  });

  // Update nav highlight on route change.
  window.addEventListener("hashchange", () => {
    const route = (location.hash || "#/dashboard").replace(/^#\/?/, "") || "dashboard";
    document.querySelectorAll(".app-nav a").forEach((a) => {
      if (a.dataset.route === route) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  });

  // Surface in-memory fallback mode if IndexedDB is unavailable.
  if (typeof indexedDB === "undefined") {
    const notice = document.getElementById("storage-notice");
    notice.hidden = false;
    notice.textContent = "Storage is unavailable — data will not persist after this session.";
  }
}
