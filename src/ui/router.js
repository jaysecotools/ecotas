import { emit } from "../core/bus.js";
import { logger } from "../core/logger.js";

const views = new Map();
let current = null;

export function registerView(route, viewModule) {
  views.set(route, viewModule);
}

function parseHash() {
  const raw = (location.hash || "#/dashboard").replace(/^#\/?/, "");
  const [route, ...rest] = raw.split("/");
  return { route: route || "dashboard", params: rest };
}

async function render() {
  const { route } = parseHash();
  const view = views.get(route);
  const main = document.getElementById("main");
  if (!view) {
    main.innerHTML = `<div class="error-panel"><h2>Not found</h2><p>No view registered for "${route}".</p></div>`;
    return;
  }
  if (current && current.unmount) {
    try { current.unmount(); } catch (err) { logger.warn("unmount error", err); }
  }
  main.innerHTML = "";
  current = view;
  try {
    await view.mount({ container: main, route });
    emit("route:changed", { route });
  } catch (err) {
    logger.error("View mount failed", err);
    main.innerHTML = `<div class="error-panel"><h2>View error</h2><p>${err.message}</p></div>`;
  }
}

export const router = {
  async start() {
    if (!location.hash) location.hash = "#/dashboard";
    window.addEventListener("hashchange", render);
    await render();
  },
  navigate(route) {
    location.hash = "#/" + route;
  },
};
