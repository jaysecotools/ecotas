// src/app.js
import { runMigrations } from "./storage/migrations.js";
import { open } from "./storage/db.js";
import { logger, setLevel } from "./core/logger.js";
import { router, registerView } from "./ui/router.js";
import { mount as mountShell } from "./ui/shell.js";

var APP_VERSION = "0.2.1";

// Lazy view registry. Each entry returns a Promise resolving to a view module.
var VIEW_LOADERS = {
  dashboard:   function () { return import("./ui/views/dashboard.js"); },
  projects:    function () { return import("./ui/views/projects.js"); },
  sites:       function () { return import("./ui/views/sites.js"); },
  species:     function () { return import("./ui/views/species.js"); },
  monitoring:  function () { return import("./ui/views/monitoring.js"); },
  maintenance: function () { return import("./ui/views/maintenance.js"); },
  compliance:  function () { return import("./ui/views/compliance.js"); },
  reports:     function () { return import("./ui/views/reports.js"); },
  settings:    function () { return import("./ui/views/settings.js"); }
};

// Report templates are also lazy-loaded; a missing one does not blank the app.
function ensureReportTemplates() {
  var files = [
    "./reports/templates/site-assessment.html.js",
    "./reports/templates/monitoring-summary.html.js",
    "./reports/templates/maintenance-report.html.js",
    "./reports/templates/project-summary.html.js"
  ];
  var chain = Promise.resolve();
  files.forEach(function (f) {
    chain = chain.then(function () {
      return import(f).catch(function (err) {
        logger.warn("Report template failed to load: " + f, err);
      });
    });
  });
  return chain;
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

function fatal(message, err) {
  logger.error(message, err);
  var main = document.getElementById("main");
  var detail = err && err.message ? err.message : String(err);
  if (main) {
    main.innerHTML =
      '<div class="error-panel">' +
        '<h2>' + escapeHtml(message) + '</h2>' +
        '<p>' + escapeHtml(detail) + '</p>' +
        '<p class="help">Open the browser console for full details.</p>' +
      '</div>';
  }
  var app = document.getElementById("app");
  if (app) app.setAttribute("aria-busy", "false");
}

async function boot() {
  setLevel("info");
  logger.info("EcoTas v" + APP_VERSION + " booting");

  try {
    await open();
  } catch (err) {
    fatal("Storage could not be opened", err);
    return;
  }

  try {
    await runMigrations();
  } catch (err) {
    fatal("Migrations failed", err);
    return;
  }

  try {
    mountShell({ appVersion: APP_VERSION });
  } catch (err) {
    fatal("Shell could not be mounted", err);
    return;
  }

  Object.keys(VIEW_LOADERS).forEach(function (route) {
    registerView(route, VIEW_LOADERS[route]);
  });

  // Kick off template loading in the background.
  ensureReportTemplates().catch(function (e) {
    logger.warn("Template preload error", e);
  });

  try {
    await router.start();
  } catch (err) {
    fatal("Router failed to start", err);
    return;
  }

  var app = document.getElementById("app");
  if (app) app.setAttribute("aria-busy", "false");
  logger.info("EcoTas ready");
}

boot().catch(function (err) {
  fatal("EcoTas could not start", err);
});
