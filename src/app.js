import { runMigrations } from "./storage/migrations.js";
import { open } from "./storage/db.js";
import { logger, setLevel } from "./core/logger.js";
import { router } from "./ui/router.js";
import { mount as mountShell } from "./ui/shell.js";
import { registerView } from "./ui/router.js";

import * as dashboardView from "./ui/views/dashboard.js";
import * as projectsView from "./ui/views/projects.js";
import * as sitesView from "./ui/views/sites.js";
import * as speciesView from "./ui/views/species.js";
import * as monitoringView from "./ui/views/monitoring.js";
import * as maintenanceView from "./ui/views/maintenance.js";
import * as complianceView from "./ui/views/compliance.js";
import * as reportsView from "./ui/views/reports.js";
import * as settingsView from "./ui/views/settings.js";

// Register report templates (side-effect imports)
import "./reports/templates/site-assessment.html.js";
import "./reports/templates/monitoring-summary.html.js";
import "./reports/templates/maintenance-report.html.js";
import "./reports/templates/project-summary.html.js";

const APP_VERSION = "0.2.0";

async function boot() {
  setLevel("info");
  logger.info(`EcoTas v${APP_VERSION} booting`);

  await open();
  await runMigrations();

  mountShell({ appVersion: APP_VERSION });

  registerView("dashboard",  dashboardView);
  registerView("projects",   projectsView);
  registerView("sites",      sitesView);
  registerView("species",    speciesView);
  registerView("monitoring", monitoringView);
  registerView("maintenance",maintenanceView);
  registerView("compliance", complianceView);
  registerView("reports",    reportsView);
  registerView("settings",   settingsView);

  await router.start();

  document.getElementById("app").setAttribute("aria-busy", "false");
}

boot().catch((err) => {
  logger.error("Boot failed", err);
  const main = document.getElementById("main");
  if (main) {
    main.innerHTML = `<div class="error-panel">
      <h2>EcoTas could not start</h2>
      <p>${String(err && err.message || err)}</p>
    </div>`;
  }
});
