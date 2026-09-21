import { createRepository } from "../storage/repository.js";
import { S } from "../core/schema.js";

const PROJECT_STATUSES = ["planned", "active", "on_hold", "completed", "archived"];

export const projectSchema = S.object({
  name: S.string({ min: 2, max: 200 }),
  code: S.string({ required: false, max: 40 }),
  status: S.enum(PROJECT_STATUSES),
  description: S.string({ required: false, max: 5000 }),
  startDate: S.date({ required: false }),
  endDate: S.date({ required: false }),
  budget: S.number({ required: false, min: 0 }),
  fundingSource: S.string({ required: false, max: 200 }),
  projectLead: S.string({ required: false, max: 120 }),
  notes: S.string({ required: false, max: 5000 }),
});

export const projects = createRepository({ name: "projects", schema: projectSchema });
export { PROJECT_STATUSES };
