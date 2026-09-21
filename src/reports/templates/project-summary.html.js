import { registerTemplate } from "../engine.js";

const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

registerTemplate("project-summary", ({ site, assessments, observations, species, maintenance }) => {
  return `
    <h1>Project summary — ${h(site.name)}</h1>
    <section>
      <h2>Site</h2>
      <dl>
        <dt>Status</dt><dd>${h(site.status)}</dd>
        <dt>NRM region</dt><dd>${h(site.nrmRegion || "—")}</dd>
        <dt>Tenure</dt><dd>${h(site.landTenure || "—")}</dd>
        <dt>Area</dt><dd>${site.areaHectares ? h(site.areaHectares) + " ha" : "—"}</dd>
        <dt>Description</dt><dd>${h(site.description || "—")}</dd>
      </dl>
    </section>
    <section>
      <h2>Record counts</h2>
      <ul>
        <li>Assessments: ${assessments.length}</li>
        <li>Observations: ${observations.length}</li>
        <li>Species records: ${species.length}</li>
        <li>Maintenance activities: ${maintenance.length}</li>
      </ul>
    </section>
    <section>
      <h2>Latest assessment</h2>
      ${assessments.length === 0
        ? `<p>None recorded.</p>`
        : (() => {
            const a = assessments.slice().sort((x, y) => (y.assessedAt || "").localeCompare(x.assessedAt || ""))[0];
            return `<p>${h(a.assessedAt)} — ${h(a.assessor)} — rating: <strong>${h(a.rating)}</strong></p>`;
          })()}
    </section>
  `;
});
