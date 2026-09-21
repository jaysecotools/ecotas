// Every report embeds a provenance block. It must be present in the output
// and must not be removable by template overrides.
export function buildProvenance({ appVersion, generatedAt, actor, recordCounts, missingData = [] }) {
  return {
    app: "EcoTas",
    appVersion,
    generatedAt: generatedAt || new Date().toISOString(),
    actor: actor || "local-user",
    recordCounts,
    missingData,
    disclaimer:
      "This report is generated from locally stored records in EcoTas. " +
      "It has not been independently verified. Ecological ratings shown are " +
      "professional judgements entered by the user, not automated determinations. " +
      "Reference lists are advisory and are not regulatory instruments.",
  };
}
