
# EcoTas

A local-first environmental management platform for Tasmanian natural resource management, conservation, and ecological restoration work.

## Status

This is **Stage 1 + Stage 2 (Foundation + Core MVP)**. It is **not production-ready** and is **not** a compliance or certification tool.

See `docs/ROADMAP.md` and the "Known Limitations" section of `docs/ARCHITECTURE.md`.

## What It Does

- Manages projects, sites, and (planned) zones
- Records Tasmanian-native, introduced, and weed species observations
- Records site assessments with a transparent, non-authoritative heuristic indicator
- Schedules and tracks maintenance activities, with overdue detection
- Provides a generic, configurable compliance checklist (no jurisdictional claim)
- Generates HTML and print-to-PDF reports with explicit provenance metadata
- Stores all data locally in IndexedDB (survives reload; cleared only by you)

## What It Does Not Do (Yet)

- No multi-user or cloud sync
- No authentication (it is a single-user local app by design)
- No GIS CRS selection beyond WGS84
- No verified regulatory database (all references are advisory, not legal advice)
- No media/photo attachments (planned for Stage 3.1)
- No GPX / KML / GeoJSON import (planned for Stage 3.2)
- No direct PDF download — reports currently use the browser's print dialog
  (a bundled PDF writer is planned for Stage 3.3)

## Requirements

- A modern browser (recent Chrome, Edge, Firefox, or Safari)
- **A local HTTP server.** EcoTas is a modern ES-module web app and will **not** work when opened directly from disk via `file://`. See the next section for why and how.
- Node.js 18+ is needed **only** to run the automated tests. It is not needed to use the app.

## IMPORTANT — How to Run

EcoTas is built as ES modules. Browsers block ES-module loading from `file://` URLs for security reasons. If you open `index.html` by double-clicking it, you will see errors like:

```text
Access to script at 'file:///.../app.js' from origin 'null' has been
blocked by CORS policy: Cross origin requests are only supported for
protocol schemes: http, https, ...
```

This is expected behaviour, not a bug. You must serve the folder over HTTP.

Pick any one of the following. All of them work identically.

### Node.js (recommended)

```bash
cd src
npx serve .
```

The first run downloads the `serve` package (about 1 MB) and then works offline. It prints a URL such as `http://localhost:3000`. Open that URL.

To serve on a specific port:

```bash
npx serve -l 8080 .
```

### Python 3

```bash
cd src
python -m http.server 8080
```

Then open `http://localhost:8080`.

On some systems the executable is `python3` rather than `python`.

### VS Code

Install the **Live Server** extension by Ritwick Dey, right-click `src/index.html`, and choose **Open with Live Server**.

### PHP

```bash
cd src
php -S localhost:8080
```

Any static HTTP server works, on any port. No build step. No configuration.

## Why Not `file://`?

ES modules (`<script type="module">`) require an HTTP origin. The `file://` protocol gives each file a unique, opaque origin ("null"), which browsers refuse to treat as same-origin.

This is a security feature, not a bug, and it cannot be safely disabled.

If you specifically need a single-file, double-clickable version, that can be produced later as a build artefact, but the source of truth will always be the modular structure.

Splitting the code into modules is what makes Stage 3 and Stage 4 work tractable.

## First-Run Verification

After starting the server and opening the page, confirm the following:

1. The header shows **EcoTas v0.2.1**, the nav is visible, and the Dashboard renders with four stat cards reading 0.
2. Add a project. It appears in the table.
3. Reload. The project is still there — this confirms IndexedDB persistence.
4. Add a site linked to that project.
5. Open Species, pick a species from the Tasmanian weed dropdown, and save it.
6. Open Maintenance, add an activity with a past due date. It should show an orange **"overdue"** pill.
7. Open Reports, select the site and the "Site assessment" template, and click Generate. A new tab opens with a printable report that ends with a **Provenance** section.

The browser console should show only two EcoTas log lines:

```text
[<time>] [info] EcoTas v0.2.1 booting
[<time>] [info] EcoTas ready
```
### If a change to a source file does not take effect

Browsers cache ES modules aggressively. After editing any file in `src/`,
do a hard reload with caching disabled:

1. Open DevTools (F12).
2. Go to the **Network** tab.
3. Tick **Disable cache**.
4. Keep DevTools open and reload the page
   (Ctrl+Shift+R on Windows, Cmd+Shift+R on macOS).

If a change still does not appear, open the app in a private/incognito
window, which has no shared cache. This is the fastest way to confirm
whether a problem is in the code or in the cache.

## Backup

Use **Settings → Download full backup (JSON)**. Keep regular off-device copies.

IndexedDB is durable but is not immune to browser data clearing, private-browsing modes, or extension interference.

To restore, use **Settings → Import** and select a previously downloaded backup file.

**Import is destructive** — it replaces records in the matching stores.

## Tests

From the project root:

```bash
node tests/run.js
```

The current suite covers schema validators and reference-data integrity.

It does not yet cover the storage layer, the domain repositories, or the UI. Those are Stage 5 items.

## Licensing of Reference Data

Tasmanian species and vegetation references are compiled from publicly available Commonwealth and State lists. Each reference file records its source and date in its `metadata` block.

These lists are **advisory**. They are not regulatory instruments and are not a substitute for official registers.

Users must verify any reference data against the current official source before relying on it.

See `src/reference/README.md`.

## Documentation

- `docs/ARCHITECTURE.md` — how the pieces fit together
- `docs/DATA-MODEL.md` — every entity and field
- `docs/ROADMAP.md` — Stage 1 through Stage 5
- `docs/TESTING.md` — what is tested and what is not
- `docs/COMPLIANCE-POSITION.md` — why EcoTas does not claim compliance
- `src/reference/README.md` — provenance rules for reference data
