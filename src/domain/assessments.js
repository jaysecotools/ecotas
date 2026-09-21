import { createRepository } from "../storage/repository.js";
import { S } from "../core/schema.js";

const HEALTH_RATINGS = ["excellent", "good", "fair", "poor", "degraded"];

export const assessmentSchema = S.object({
  siteId: S.string({ min: 4, max: 40 }),
  assessedAt: S.date(),
  assessor: S.string({ min: 2, max: 120 }),
  // The following are the user's professional judgement, not automated outputs.
  rating: S.enum(HEALTH_RATINGS),
  components: S.array({ required: false }),
  threats: S.array({ required: false }),
  vegetationCoverPct: S.number({ required: false, min: 0, max: 100 }),
  nativeSpeciesPct: S.number({ required: false, min: 0, max: 100 }),
  weedCoverPct: S.number({ required: false, min: 0, max: 100 }),
  soilStability: S.number({ required: false, min: 1, max: 5, integer: true }),
  speciesRichness: S.number({ required: false, min: 0, integer: true }),
  notes: S.string({ required: false, max: 5000 }),
  limitations: S.string({ required: false, max: 2000 }),
});

export const assessments = createRepository({ name: "assessments", schema: assessmentSchema });

// IMPORTANT: This is a *heuristic* indicator for internal trend tracking only.
// It is NOT an ecological determination, and it does not replace professional
// judgement. The formula is documented here so users can see exactly what
// it does and can override the rating on the assessment record.
export function heuristicIndex(assessment) {
  const { vegetationCoverPct, nativeSpeciesPct, weedCoverPct, soilStability, speciesRichness } = assessment;
  const parts = [];
  const weights = [];
  if (typeof vegetationCoverPct === "number") { parts.push(vegetationCoverPct); weights.push(0.3); }
  if (typeof nativeSpeciesPct === "number") { parts.push(nativeSpeciesPct); weights.push(0.3); }
  if (typeof weedCoverPct === "number") { parts.push(100 - weedCoverPct); weights.push(0.2); }
  if (typeof soilStability === "number") { parts.push((soilStability - 1) * 25); weights.push(0.1); }
  if (typeof speciesRichness === "number") { parts.push(Math.min(speciesRichness * 5, 100)); weights.push(0.1); }
  if (parts.length === 0) return null;
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weighted = parts.reduce((sum, p, i) => sum + p * weights[i], 0) / totalWeight;
  return {
    value: Math.round(weighted),
    components: { vegetationCoverPct, nativeSpeciesPct, weedCoverPct, soilStability, speciesRichness },
    caveat: "Heuristic indicator for internal trend tracking only. Not an ecological determination.",
  };
}

export { HEALTH_RATINGS };
