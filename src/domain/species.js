import { createRepository } from "../storage/repository.js";
import { S } from "../core/schema.js";

const SPECIES_KINGDOMS = ["flora", "fauna", "fungi", "other"];
const SPECIES_STATUSES = [
  "native",
  "introduced",
  "weed",
  "pest",
  "threatened",
  "endangered",
  "vulnerable",
  "extinct_in_tasmania",
];

export const speciesSchema = S.object({
  siteId: S.string({ min: 4, max: 40 }),
  scientificName: S.string({ min: 2, max: 200 }),
  commonName: S.string({ required: false, max: 200 }),
  kingdom: S.enum(SPECIES_KINGDOMS),
  status: S.enum(SPECIES_STATUSES),
  count: S.number({ required: false, min: 0, integer: true }),
  observedAt: S.date({ required: false }),
  location: S.latLng({ required: false }) || (() => null),
  habitat: S.string({ required: false, max: 500 }),
  notes: S.string({ required: false, max: 2000 }),
  source: S.enum(["field_observation", "reference_list", "external"], { required: false }) || (() => "field_observation"),
});

export const species = createRepository({ name: "species", schema: speciesSchema });
export { SPECIES_KINGDOMS, SPECIES_STATUSES };
