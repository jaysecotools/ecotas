export function sitesToGeoJSON(sites) {
  return {
    type: "FeatureCollection",
    features: sites
      .filter((s) => s.centre && Number.isFinite(s.centre.lat) && Number.isFinite(s.centre.lng))
      .map((s) => ({
        type: "Feature",
        id: s.id,
        properties: {
          name: s.name,
          status: s.status,
          areaHectares: s.areaHectares ?? null,
          nrmRegion: s.nrmRegion ?? null,
        },
        geometry: { type: "Point", coordinates: [s.centre.lng, s.centre.lat] },
      })),
  };
}
