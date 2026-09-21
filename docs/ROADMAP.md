# EcoTas Roadmap

## Stage 1 — Foundation ✅ (this delivery)

- Modular repo structure
- Core primitives (ids, schema, bus, errors, logger)
- IndexedDB storage + migrations
- Domain modules for projects, sites, species, monitoring, maintenance, assessments, compliance
- Tasmanian reference data (advisory)
- Reporting engine with mandatory provenance
- UI shell (router, form/toast helpers, one view per domain)
- Tests for schema and reference data

## Stage 2 — Core MVP ✅ (this delivery)

- End-to-end CRUD for the five primary entities
- Reports: site-assessment, monitoring-summary, maintenance-report, project-summary
- Export: full JSON backup, CSV per collection

## Stage 3 — Professional functionality (next)

- Fix schema optional coordinate
- Extract test helpers; eliminate circular import
- GPX / KML / GeoJSON import with real parsers
- Photo attachments via IndexedDB blobs (not base64)
- PDF export via a bundled library, not `window.print()`
- Species autocomplete from Tasmanian reference lists
- Data validation overlays on map (drawn polygons)
- Advanced report templates (trend, before/after)
- Import merge strategy (deduplicate by scientific name + siteId)

## Stage 4 — Commercial deployment

- Optional server-backed mode (Node + Postgres) with the same domain layer
- Real authentication and role-based permissions
- Server-side file storage for media
- HTTPS, backup, audit trail immutability
- Deployment docs, migration tooling, support runbook
- Licensing review of all third-party data

## Stage 5 — Validation

- Functional, data-integrity, security, accessibility, responsive tests
- User acceptance testing with at least three Tasmanian environmental
  professionals
- Performance testing with 10,000+ records per store
- Offline and sync tests (if Stage 4 is deployed)
