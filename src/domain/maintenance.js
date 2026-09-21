import { createRepository } from "../storage/repository.js";
import { S } from "../core/schema.js";

const MAINTENANCE_TYPES = [
  "weed_control",
  "revegetation",
  "erosion_control",
  "pest_management",
  "water_quality",
  "trail_maintenance",
  "equipment",
  "other",
];
const MAINTENANCE_STATUSES = ["planned", "scheduled", "in_progress", "completed", "cancelled"];
const MAINTENANCE_PRIORITIES = ["low", "medium", "high"];

export const maintenanceSchema = S.object({
  siteId: S.string({ min: 4, max: 40 }),
  title: S.string({ min: 2, max: 200 }),
  type: S.enum(MAINTENANCE_TYPES),
  status: S.enum(MAINTENANCE_STATUSES),
  priority: S.enum(MAINTENANCE_PRIORITIES),
  dueDate: S.date({ required: false }),
  completedAt: S.date({ required: false }),
  assignee: S.string({ required: false, max: 120 }),
  description: S.string({ required: false, max: 5000 }),
  notes: S.string({ required: false, max: 5000 }),
});

export const maintenance = createRepository({ name: "maintenance", schema: maintenanceSchema });
export { MAINTENANCE_TYPES, MAINTENANCE_STATUSES, MAINTENANCE_PRIORITIES };
