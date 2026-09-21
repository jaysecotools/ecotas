import { createRepository } from "../storage/repository.js";
import { S } from "../core/schema.js";

// IMPORTANT: EcoTas does NOT assert that any jurisdiction's legislation has
// been satisfied. The compliance module lets an organisation define its own
// checklist items, and track status against them. Any claim of legal
// compliance is the user's responsibility and must be supported by their
// own evidence and professional advice.

const COMPLIANCE_STATUSES = ["not_started", "in_progress", "met", "not_met", "not_applicable"];

export const complianceItemSchema = S.object({
  siteId: S.string({ min: 4, max: 40 }),
  framework: S.string({ min: 2, max: 200 }),      // e.g., "Organisation EMS", "Client requirement"
  reference: S.string({ required: false, max: 300 }), // user-supplied source
  requirement: S.string({ min: 2, max: 500 }),
  status: S.enum(COMPLIANCE_STATUSES),
  evidence: S.string({ required: false, max: 2000 }),
  reviewDate: S.date({ required: false }),
  notes: S.string({ required: false, max: 2000 }),
});

export const complianceItems = createRepository({ name: "compliance", schema: complianceItemSchema });
export { COMPLIANCE_STATUSES };
