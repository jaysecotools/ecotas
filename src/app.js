// src/app.js
import { runMigrations } from "./storage/migrations.js";
import { open } from "./storage/db.js";
import { logger, setLevel } from "./core/logger.js";
import { router, registerView } from "./ui/router.js";
import { mount as mountShell } from "./ui/shell.js";

const APP_VERSION = "0.2.1";

// Lazy view registry. Each entry is a function that returns a Promise
// resolving to a view module ({ mount, unmount }).
const VIEW_LOADERS = {
  dashboard:   () => import("./ui/views/dashboard.js"),
  projects:    () => import("./ui/views/projects.js"),
  sites:       () => import("./ui/views/sites.js"),
  species:     () => import("./ui/views/species.js"),
  monitoring:  () => import("./ui/views/monitoring.js"),
  maintenance: () => import("./ui/views/maintenance.js"),
  compliance:  () => import("./ui/views/compliance.js"),
  reports:     () => import("./ui/views/reports.js"),
  settings:    () => import("./ui/views/settings.js"),
};

// Report templates are also lazy-loaded on first report render, so a
// broken template cannot blank the entire application.
async function ensureReportTemplates() {
  // The import of each template file registers it with the report engine
  // as a side effect. We import them all once; failures are logged but
  // do not propagate.
  const files = [
    "./reports/templates/site-assessment.html.js",
    "./reports/templates/monitoring-summary.html.js",
    "./reports/templates/maintenance-report.html.js",
    "./reports/templates/project-summary.html.js",
  ];
  for (const f of files) {
    try {
      await import(/* @vite-ignore */ f);
    } catch (err) {
      logger.warn(`Report template failed to load: ${f}`, err);
    }
  }
}

async function boot() {
  setLevel("info");
  logger.info(`EcoTas v${APP_VERSION} booting`);

  // Wrap each major step so a single failure shows a useful message
  // instead of a blank page.
  try {
    await open();
  } catch (err) {
    return fatal("Storage could not be opened", err);
  }

  try {
    await runMigrations();
  } catch (err) {
    return fatal("Migrations failed", err);
  }

  try {
    mountShell({ appVersion: APP_VERSION });
  } catch (err) {
    return fatal("Shell could not be mounted", err);
  }

  // Register lazy view loaders.
  for (const [route, loader] of Object.entries(VIEW_LOADERS)) {
    registerView(route, loader);
  }

  // Kick off template loading without blocking boot.
  ensureReportTemplates().catch((e) => logger.warn("Template preload error", e));

  try {
    await router.start();
  } catch (err) {
    return fatal("Router failed to start", err);
  }

  document.getElementById("app").setAttribute("aria-busy", "false");
  logger.info("EcoTas ready");
}

function fatal(message, err) {
  logger.error(message, err);
  const main = document.getElementById("main");
  if (main) {
    main.innerHTML = `
      <div class="error-panel">
        <h2>${escape(message)}</h2>
        <p>${escape(err && err.message ? err.message : String(err))}</p>
        <p class="help">Open the browser console for full details.</p>
      </div>`;
  }
  document.getElementById("app").setAttribute("aria-busy", "false");
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

boot().catch((err) => fatal("EcoTas could not start", err));
