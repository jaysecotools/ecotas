```javascript
// src/app.js

const APP_VERSION = "0.2.1";

// Lazy view registry.
// Each entry returns a Promise resolving to a view module
// containing { mount, unmount }.
const VIEW_LOADERS = {
  dashboard: () => import("./ui/views/dashboard.js"),
  projects: () => import("./ui/views/projects.js"),
  sites: () => import("./ui/views/sites.js"),
  species: () => import("./ui/views/species.js"),
  monitoring: () => import("./ui/views/monitoring.js"),
  maintenance: () => import("./ui/views/maintenance.js"),
  compliance: () => import("./ui/views/compliance.js"),
  reports: () => import("./ui/views/reports.js"),
  settings: () => import("./ui/views/settings.js"),
};


// ------------------------------------------------------------
// Application boot
// ------------------------------------------------------------

async function boot() {

  // ----------------------------------------------------------
  // Load core modules dynamically.
  //
  // This is deliberate: if one of these modules is broken,
  // the error can be caught and displayed instead of leaving
  // the application completely blank.
  // ----------------------------------------------------------

  let logger;
  let setLevel;
  let open;
  let runMigrations;
  let router;
  let registerView;
  let mountShell;

  try {
    const loggerModule = await import("./core/logger.js");

    logger = loggerModule.logger;
    setLevel = loggerModule.setLevel;

    setLevel("info");
    logger.info(`EcoTas v${APP_VERSION} booting`);

  } catch (err) {
    return fatal(
      "Logger could not be loaded",
      err
    );
  }


  // ----------------------------------------------------------
  // Load storage
  // ----------------------------------------------------------

  try {
    const dbModule = await import("./storage/db.js");
    open = dbModule.open;

    await open();

  } catch (err) {
    return fatal(
      "Storage could not be opened",
      err
    );
  }


  // ----------------------------------------------------------
  // Run database migrations
  // ----------------------------------------------------------

  try {
    const migrationsModule = await import("./storage/migrations.js");
    runMigrations = migrationsModule.runMigrations;

    await runMigrations();

  } catch (err) {
    return fatal(
      "Migrations failed",
      err
    );
  }


  // ----------------------------------------------------------
  // Load router and shell
  // ----------------------------------------------------------

  try {
    const routerModule = await import("./ui/router.js");
    router = routerModule.router;
    registerView = routerModule.registerView;

    const shellModule = await import("./ui/shell.js");
    mountShell = shellModule.mount;

  } catch (err) {
    return fatal(
      "User interface modules could not be loaded",
      err
    );
  }


  // ----------------------------------------------------------
  // Mount application shell
  // ----------------------------------------------------------

  try {
    mountShell({
      appVersion: APP_VERSION
    });

  } catch (err) {
    return fatal(
      "Shell could not be mounted",
      err
    );
  }


  // ----------------------------------------------------------
  // Register lazy views
  // ----------------------------------------------------------

  try {

    for (const [route, loader] of Object.entries(VIEW_LOADERS)) {
      registerView(route, loader);
    }

  } catch (err) {
    return fatal(
      "Views could not be registered",
      err
    );
  }


  // ----------------------------------------------------------
  // Start router
  // ----------------------------------------------------------

  try {

    await router.start();

  } catch (err) {
    return fatal(
      "Router failed to start",
      err
    );
  }


  // ----------------------------------------------------------
  // Report templates
  //
  // These are deliberately loaded after the application has
  // started. A missing/broken report template must never stop
  // the main EcoTas interface from loading.
  // ----------------------------------------------------------

  ensureReportTemplates(logger);


  // ----------------------------------------------------------
  // Application ready
  // ----------------------------------------------------------

  const app = document.getElementById("app");

  if (app) {
    app.setAttribute("aria-busy", "false");
  }

  logger.info("EcoTas ready");
}


// ------------------------------------------------------------
// Report templates
// ------------------------------------------------------------

async function ensureReportTemplates(logger) {

  const files = [
    "./reports/templates/site-assessment.html.js",
    "./reports/templates/monitoring-summary.html.js",
    "./reports/templates/maintenance-report.html.js",
    "./reports/templates/project-summary.html.js"
  ];

  for (const file of files) {

    try {

      await import(file);

      logger.info(
        `Report template loaded: ${file}`
      );

    } catch (err) {

      // A report template failure is non-fatal.
      logger.warn(
        `Report template failed to load: ${file}`,
        err
      );
    }
  }
}


// ------------------------------------------------------------
// Fatal startup error
// ------------------------------------------------------------

function fatal(message, err) {

  console.error(
    `EcoTas startup error: ${message}`,
    err
  );

  const main = document.getElementById("main");

  if (main) {

    main.innerHTML = `
      <div class="error-panel">
        <h2>${escape(message)}</h2>

        <p>
          ${escape(
            err && err.message
              ? err.message
              : String(err)
          )}
        </p>

        <p class="help">
          Open the browser console for full details.
        </p>
      </div>
    `;

  } else {

    // If even the main application container is missing,
    // fall back to the document body.
    document.body.innerHTML = `
      <div class="error-panel">
        <h2>${escape(message)}</h2>

        <p>
          ${escape(
            err && err.message
              ? err.message
              : String(err)
          )}
        </p>

        <p class="help">
          The EcoTas application could not initialise.
        </p>
      </div>
    `;
  }

  const app = document.getElementById("app");

  if (app) {
    app.setAttribute("aria-busy", "false");
  }
}


// ------------------------------------------------------------
// HTML escaping
// ------------------------------------------------------------

function escape(value) {

  return String(value ?? "").replace(
    /[&<>"]/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    })[character]
  );
}


// ------------------------------------------------------------
// Start EcoTas
// ------------------------------------------------------------

boot().catch((err) => {
  fatal(
    "EcoTas could not start",
    err
  );
});
```
