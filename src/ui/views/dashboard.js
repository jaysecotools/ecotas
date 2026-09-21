import { projects } from "../../domain/projects.js";
import { sites } from "../../domain/sites.js";
import { species } from "../../domain/species.js";
import { observations } from "../../domain/monitoring.js";
import { maintenance } from "../../domain/maintenance.js";
import { assessments } from "../../domain/assessments.js";
import { on } from "../../core/bus.js";

let containerRef = null;
let unsubs = [];

export async function mount({ container }) {
  containerRef = container;
  const events = [
    "projects:created", "projects:updated", "projects:deleted",
    "sites:created",    "sites:updated",    "sites:deleted",
    "species:created",  "species:updated",  "species:deleted",
    "observations:created", "observations:updated", "observations:deleted",
    "maintenance:created",  "maintenance:updated",  "maintenance:deleted",
    "assessments:created",  "assessments:updated",  "assessments:deleted",
  ];
  for (const ev of events) unsubs.push(on(ev, render));
  await render();
}

export function unmount() {
  unsubs.forEach((u) => u());
  unsubs = [];
  containerRef = null;
}

async function render() {
  if (!containerRef) return;

  const [
    allProjects, allSites, allSpecies, allObs, allMaint, allAssess,
  ] = await Promise.all([
    projects.list(),
    sites.list(),
    species.list(),
    observations.list(),
    maintenance.list(),
    assessments.list(),
  ]);

  const now = Date.now();
  const overdueMaintenance = allMaint.filter(
    (m) => m.dueDate && m.status !== "completed" && m.status !== "cancelled" && new Date(m.dueDate).getTime() < now
  );
  const upcomingMaintenance = allMaint
    .filter((m) => m.dueDate && m.status !== "completed" && m.status !== "cancelled" && new Date(m.dueDate).getTime() >= now)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8);

  const recentObservations = allObs
    .slice()
    .sort((a, b) => (b.observedAt || "").localeCompare(a.observedAt || ""))
    .slice(0, 8);

  containerRef.innerHTML = `
    <header class="view-header">
      <h1>Dashboard</h1>
      <p class="help">A summary of your EcoTas data. All figures are computed from local records only.</p>
    </header>

    <section class="panel grid-4">
      <div class="stat"><div class="stat-num">${allProjects.length}</div><div class="stat-label">Projects</div></div>
      <div class="stat"><div class="stat-num">${allSites.length}</div><div class="stat-label">Sites</div></div>
      <div class="stat"><div class="stat-num">${allSpecies.length}</div><div class="stat-label">Species records</div></div>
      <div class="stat"><div class="stat-num">${allObs.length}</div><div class="stat-label">Observations</div></div>
    </section>

    <section class="panel grid-2">
      <div>
        <h2>Maintenance attention</h2>
        ${overdueMaintenance.length === 0
          ? `<p class="help">No overdue maintenance.</p>`
          : `<p><strong>${overdueMaintenance.length}</strong> overdue item(s).</p>
             <ul class="list">
               ${overdueMaintenance.slice(0, 6).map((m) =>
                 `<li><span class="pill pill-warn">Due ${escape(m.dueDate)}</span> ${escape(m.title)}</li>`
               ).join("")}
             </ul>`}
        <h3>Upcoming</h3>
        ${upcomingMaintenance.length === 0
          ? `<p class="help">Nothing scheduled.</p>`
          : `<ul class="list">
               ${upcomingMaintenance.map((m) =>
                 `<li><span class="pill">${escape(m.dueDate)}</span> ${escape(m.title)}</li>`
               ).join("")}
             </ul>`}
      </div>
      <div>
        <h2>Recent observations</h2>
        ${recentObservations.length === 0
          ? `<p class="help">No observations recorded.</p>`
          : `<ul class="list">
               ${recentObservations.map((o) =>
                 `<li><span class="pill">${escape(o.observedAt)}</span> ${escape(o.type)} — ${escape(o.observer)}</li>`
               ).join("")}
             </ul>`}
        <h3>Recent assessments</h3>
        ${allAssess.length === 0
          ? `<p class="help">No assessments recorded.</p>`
          : `<ul class="list">
               ${allAssess.slice().sort((a, b) => (b.assessedAt || "").localeCompare(a.assessedAt || "")).slice(0, 5).map((a) =>
                 `<li><span class="pill">${escape(a.assessedAt)}</span> ${escape(a.rating)}</li>`
               ).join("")}
             </ul>`}
      </div>
    </section>
  `;
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
