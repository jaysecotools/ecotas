# Data Model

All entities share:
- id (ULID string)
- createdAt (ISO date-time)
- updatedAt (ISO date-time)

## projects
name, code, status (planned|active|on_hold|completed|archived),
description, startDate, endDate, budget, fundingSource, projectLead, notes

## sites
projectId, name, status, address, nrmRegion, landTenure, areaHectares,
centre {lat,lng}, boundary [[lat,lng]...], description

## zones
(schema declared in repository; view not yet built)
siteId, name, geometry, notes

## species
siteId, scientificName, commonName, kingdom
(flora|fauna|fungi|other), status
(native|introduced|weed|pest|threatened|endangered|vulnerable|extinct_in_tasmania),
count, observedAt, location {lat,lng}, habitat, notes, source

## observations
siteId, type (vegetation|fauna|water_quality|soil|erosion|weed_density|photo_point),
observedAt, observer, protocol, location {lat,lng}, measurements {}, speciesIds [],
notes

## assessments
siteId, assessedAt, assessor, rating (excellent|good|fair|poor|degraded),
components [], threats [], vegetationCoverPct, nativeSpeciesPct, weedCoverPct,
soilStability, speciesRichness, notes, limitations

## maintenance
siteId, title, type, status, priority, dueDate, completedAt, assignee,
description, notes

## compliance
siteId, framework, reference, requirement, status
(not_started|in_progress|met|not_met|not_applicable),
evidence, reviewDate, notes

## auditLog (append-only)
id, at, action (create|update|delete), entity, entityId, details, actor
