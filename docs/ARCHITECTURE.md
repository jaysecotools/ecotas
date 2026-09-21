# EcoTas Architecture

## Overview

EcoTas is a local-first, single-user, browser-based application. There is no
backend in Stage 2. Data is stored in IndexedDB under a single origin.

## Layers

1. **core/** — primitives: ids, schema, bus, errors, logger.
2. **storage/** — IndexedDB wrapper, migrations, generic repository.
3. **domain/** — one module per aggregate (projects, sites, species, ...).
4. **reference/** — advisory Tasmanian lists (JSON + loader).
5. **reports/** — HTML report engine + templates.
6. **ui/** — router, shell, form/toast helpers, views.
7. **export/** — JSON, CSV, GeoJSON writers.

## Data flow

UI → domain module → repository → schema validation → IndexedDB
                                        ↘ auditLog (always)
                                        ↘ bus events (UI subscribes)

## Why local-first?

Environmental field work often occurs where connectivity is poor. A local-first
model guarantees the app is usable offline, and provides a clear migration path
to a server-backed mode in Stage 4 without changing the domain modules.

## Why IndexedDB (not localStorage)?

- Larger quota (typically tens to hundreds of MB per origin, versus ~5 MB)
- Structured indexes (siteId, status, dates)
- Asynchronous by design, so the UI does not block
- Clear upgrade path to a server-backed store

## Not in scope (Stage 2)

- Multi-user / authentication
- Server-side sync or conflict resolution
- Server-side file storage for photos
- Real GPX / KML / shapefile parsing
- Real CRS handling (all coordinates are WGS84)

## Known Limitations

- Species observation `location` is currently mandatory at the schema level.
  The intended optional form is a Stage 3 fix.
- Test runner has a circular import between `run.js` and test helper modules.
  Stage 3 will extract helpers into `tests/_helpers.js`.
- The `heuristicIndex` is a transparent, non-authoritative indicator. It is
  labelled as such in the UI and in reports, but users should be aware that
  it is a product decision, not a scientific standard.
- Reference data is advisory. It is not a regulatory instrument.
