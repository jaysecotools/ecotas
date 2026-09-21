import { renderReport } from "../../reports/engine.js";
import { sites } from "../../domain/sites.js";
import { assessments } from "../../domain/assessments.js";
import { observations } from "../../domain/monitoring.js";
import { species } from "../../domain/species.js";
import { toast } from "../toast.js";

let containerRef = null;

export async function mount({ container }) {
  containerRef = container;
  await render();
}

export function unmount() { containerRef = null; }

async function render() {
  const allSites = await sites.list();
  containerRef.innerHTML = `
    <header class="view-header"><h1>Reports</h1></header>
    <section class="panel">
      <label>Site
        <select id="report-site">
          ${allSites.map((s) => `<option value="${s.id}">${escape(s.name)}</option>`).join("")}
        </select>
      </label>
      <label>Template
        <select id="report-template">
          <option value="site-assessment">Site assessment</option>
          <option value="monitoring-summary">Monitoring summary</option>
          <option value="maintenance-report">Maintenance report</option>
          <option value="project-summary">Project summary</option>
        </select>
      </label>
      <button id="report-generate" class="btn btn-primary">Generate</button>
    </section>
    <section class="panel" id="report-preview"></section>
  `;

  containerRef.querySelector("#report-generate").addEventListener("click", async () => {
    const siteId = containerRef.querySelector("#report-site").value;
    const templateId = containerRef.querySelector("#report-template").value;
    if (!siteId) { toast("Create a site first", "warn"); return; }

    const site = allSites.find((s) => s.id === siteId);
    const [assess, obs, spec] = await Promise.all([
      assessments.list().then((xs) => xs.filter((x) => x.siteId === siteId)),
      observations.list().then((xs) => xs.filter((x) => x.siteId === siteId)),
      species.list().then((xs) => xs.filter((x) => x.siteId === siteId)),
    ]);

    const html = await renderReport(templateId, {
      site, assessments: assess, observations: obs, species: spec,
      provenance: {
        appVersion: "0.2.0",
        recordCounts: { assessments: assess.length, observations: obs.length, species: spec.length },
        missingData: [
          !site.boundary || !site.boundary.length ? "Site boundary" : null,
          !site.areaHectares ? "Site area" : null,
        ].filter(Boolean),
      },
    });

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  });
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
