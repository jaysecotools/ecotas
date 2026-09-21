import { observations, MONITORING_TYPES } from "../../domain/monitoring.js";
import { sites } from "../../domain/sites.js";
import { species } from "../../domain/species.js";
import { buildForm } from "../form.js";
import { toast } from "../toast.js";
import { on } from "../../core/bus.js";

let containerRef = null;
let unsubs = [];

export async function mount({ container }) {
  containerRef = container;
  ["observations:created","observations:updated","observations:deleted","sites:created","sites:deleted"]
    .forEach((ev) => unsubs.push(on(ev, render)));
  await render();
}

export function unmount() {
  unsubs.forEach((u) => u());
  unsubs = [];
  containerRef = null;
}

async function render() {
  if (!containerRef) return;
  const [allObs, allSites] = await Promise.all([observations.list(), sites.list()]);
  const siteMap = new Map(allSites.map((s) => [s.id, s.name]));

  if (allSites.length === 0) {
    containerRef.innerHTML = `
      <header class="view-header"><h1>Monitoring</h1></header>
      <section class="panel"><p>Create a site first.</p><a class="btn btn-primary" href="#/sites">Go to Sites</a></section>`;
    return;
  }

  containerRef.innerHTML = `
    <header class="view-header"><h1>Monitoring</h1></header>

    <section class="panel" id="mon-form-slot">
      <h2>Add observation</h2>
    </section>

    <section class="panel">
      <h2>Observations (${allObs.length})</h2>
      <table class="eco-table">
        <thead><tr><th>Date</th><th>Type</th><th>Site</th><th>Observer</th><th>Location</th><th>Notes</th><th></th></tr></thead>
        <tbody>
          ${allObs.length === 0
            ? `<tr><td colspan="7">No observations yet.</td></tr>`
            : allObs.slice().sort((a, b) => (b.observedAt || "").localeCompare(a.observedAt || "")).map((o) => `
              <tr>
                <td>${escape(o.observedAt)}</td>
                <td>${escape(o.type)}</td>
                <td>${escape(siteMap.get(o.siteId) || "—")}</td>
                <td>${escape(o.observer)}</td>
                <td>${o.location ? `${o.location.lat.toFixed(4)}, ${o.location.lng.toFixed(4)}` : "—"}</td>
                <td>${escape((o.notes || "").slice(0, 60))}</td>
                <td class="row-actions"><button class="btn btn-danger btn-sm" data-delete="${o.id}">Delete</button></td>
              </tr>`).join("")}
        </tbody>
      </table>
    </section>
  `;

  const form = buildForm([
    { name: "siteId", label: "Site", type: "select",
      options: allSites.map((s) => ({ value: s.id, label: s.name })) },
    { name: "type", label: "Type", type: "select", options: MONITORING_TYPES, value: "vegetation" },
    { name: "observedAt", label: "Date", type: "date" },
    { name: "observer", label: "Observer", type: "text" },
    { name: "protocol", label: "Protocol", type: "text" },
    { name: "latitude", label: "Latitude", type: "number", step: "any" },
    { name: "longitude", label: "Longitude", type: "number", step: "any" },
    { name: "notes", label: "Notes", type: "textarea" },
  ], {
    onSubmit: async (values) => {
      await observations.create({
        siteId: values.siteId,
        type: values.type,
        observedAt: values.observedAt,
        observer: values.observer,
        protocol: values.protocol,
        location: { lat: Number(values.latitude), lng: Number(values.longitude) },
        measurements: {},
        speciesIds: [],
        notes: values.notes,
      });
      toast("Observation saved", "success");
    },
  }).el;
  containerRef.querySelector("#mon-form-slot").appendChild(form);

  containerRef.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this observation?")) return;
      await observations.remove(btn.dataset.delete);
      toast("Observation deleted", "info");
    });
  });
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
