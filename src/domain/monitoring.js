import { createRepository } from "../storage/repository.js";
import { S } from "../core/schema.js";

const MONITORING_TYPES = [
  "vegetation",
  "fauna",
  "water_quality",
  "soil",
  "erosion",
  "weed_density",
  "photo_point",
];

export const observationSchema = S.object({
  siteId: S.string({ min: 4, max: 40 }),
  type: S.enum(MONITORING_TYPES),
  observedAt: S.date(),
  observer: S.string({ min: 2, max: 120 }),
  protocol: S.string({ required: false, max: 200 }),
  location: S.latLng(),
  measurements: S.object({}),   // free-form; documented in reports
  speciesIds: S.array({ required: false }),
  notes: S.string({ required: false, max: 5000 }),
});

export const observations = createRepository({ name: "observations", schema: observationSchema });
export { MONITORING_TYPES };
