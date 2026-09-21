import { createRepository } from "../storage/repository.js";
import { S } from "../core/schema.js";

const SITE_STATUSES = ["planned", "active", "monitoring", "completed", "archived"];

export const siteSchema = S.object({
  projectId: S.string({ min: 4, max: 40 }),
  name: S.string({ min: 2, max: 200 }),
  status: S.enum(SITE_STATUSES),
  address: S.string({ required: false, max: 300 }),
  nrmRegion: S.string({ required: false, max: 100 }),
  landTenure: S.string({ required: false, max: 100 }),
  areaHectares: S.number({ required: false, min: 0 }),
  centre: S.latLng(),
  boundary: S.array({ required: false, max: 5000 }),
  description: S.string({ required: false, max: 5000 }),
});

export const sites = createRepository({ name: "sites", schema: siteSchema });
export { SITE_STATUSES };
