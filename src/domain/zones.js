import { createRepository } from "../storage/repository.js";
import { S } from "../core/schema.js";

export const zoneSchema = S.object({
  siteId: S.string({ min: 4, max: 40 }),
  name: S.string({ min: 1, max: 200 }),
  purpose: S.string({ required: false, max: 300 }),
  boundary: S.array({ required: false, max: 5000 }),
  notes: S.string({ required: false, max: 2000 }),
});

export const zones = createRepository({ name: "zones", schema: zoneSchema });
