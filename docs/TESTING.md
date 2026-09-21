# Testing

Run:

    node tests/run.js

The suite covers:
- schema validators (positive and negative cases)
- reference data integrity (files exist, metadata is present, no duplicates)

Not yet automated (Stage 5):
- IndexedDB repository round-trips
- Full CRUD workflows through the UI
- Report template rendering
- Export format validity
