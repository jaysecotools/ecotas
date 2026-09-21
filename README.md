# EcoTas

A local-first environmental management platform for Tasmanian natural resource
management, conservation, and ecological restoration work.

## Status

This is Stage 1 + Stage 2 (Foundation + Core MVP). It is **not** production-ready
and is **not** a compliance or certification tool. See `docs/ROADMAP.md` and the
"Known Limitations" section of `docs/ARCHITECTURE.md`.

## What It Does

- Manages organisations, projects, sites, and zones
- Records Tasmanian-native and weed species observations
- Records site assessments with a transparent, non-authoritative health indicator
- Schedules and tracks maintenance activities
- Provides a generic, configurable compliance checklist (no jurisdictional claim)
- Generates HTML and print-to-PDF reports with explicit provenance
- Stores all data locally in IndexedDB (survives reload, cleared only by you)

## What It Does Not Do (Yet)

- No multi-user or cloud sync
- No authentication (it is a single-user local app by design)
- No GIS CRS selection beyond WGS84
- No verified regulatory database (all references are advisory, not legal advice)

## Requirements

- A modern browser (Chrome, Edge, Firefox, Safari — recent versions)
- No build step required for use; optional Node.js for tests

## Running

Open `src/index.html` in a modern browser. That's it.

Optional — run tests:

    node tests/run.js

Optional — serve over HTTP (recommended for IndexedDB reliability):

    npx serve src
    # or
    python3 -m http.server 8080 --directory src

## Backup

Use **Settings → Export → Full backup (JSON)**. Keep regular off-device copies.
IndexedDB is durable but not immune to browser data clearing.

## Licensing of Reference Data

Tasmanian species and vegetation references are sourced from publicly available
Commonwealth and State lists. Each reference file records its source and date.
Users must verify any reference data against the current official source before
relying on it. See `src/reference/README.md`.
