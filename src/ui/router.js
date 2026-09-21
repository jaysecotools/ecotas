// src/ui/router.js
import { emit } from "../core/bus.js";
import { logger } from "../core/logger.js";

const views = new Map();       // route -> module | loader
const resolved = new Map();    // route -> module (cache)
let current = null;

export function registerView(route, viewOrLoader) {
  views.set(route, viewOrLoader);
}

function parseHash() {
  const raw = (location.hash || "#/dashboard").replace(/^#\/?/, "");
  const [route] = raw.split("/");
  return route || "dashboard";
}

async function resolveView(route) {
  if (resolved.has(route)) return resolved.get(route);
  const entry = views.get(route);
  if (!entry) return null;
  let mod = entry;
  if (typeof entry === "function") {
    mod = await entry();
  }
  resolved.set(route, mod);
  return mod;
}

async function render() {
  const route = parseHash();
  const main = document.getElementById("main");
  if (!main) return;

  if (current && current.unmount) {
    try { current.unmount(); } catch (err) { logger.warn("unmount error", err); }
  }
  current = null;
  main.innerHTML = "";

  let mod;
  try {
    mod = await resolveView(route);
  } catch (err) {
    logger.error(`View "${route}" failed to load`, err);
    main.innerHTML = `
      <div class="error-panel">
        <h2>View unavailable</h2>
        <p>The "${escape(route)}" view could not be loaded: ${escape(err.message || String(err))}</p>
        <p class="help">This usually means a file is missing from <code>src/ui/views/</code>.</p>
      </div>`;
    return;
  }

  if (!mod) {
    main.innerHTML = `
      <div class="error-panel">
        <h2>Not found</h2>
        <p>No view registered for "${escape(route)}".</p>
      </div>`;
    return;
  }

  current = mod;
  try {
    await mod.mount({ container: main, route });
    emit("route:changed", { route });
  } catch (err) {
    logger.error(`View "${route}" failed to mount`, err);
    main.innerHTML = `
      <div class="error-panel">
        <h2>View error</h2>
        <p>${escape(err.message || String(err))}</p>
      </div>`;
  }
}

export const router = {
  async start() {
    if (!location.hash) location.hash = "#/dashboard";
    window.addEventListener("hashchange", render);
    await render();
  },
  navigate(route) { location.hash = "#/" + route; },
};

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
