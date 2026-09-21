import { species, SPECIES_KINGDOMS, SPECIES_STATUSES } from "../../domain/species.js";
import { sites } from "../../domain/sites.js";
import { loadReference } from "../../reference/index.js";
import { buildForm } from "../form.js";
import { toast } from "../toast.js";
import { on } from "../../core/bus.js";

let containerRef = null;
let unsubs = [];

export async function mount({ container }) {
  containerRef = container;
  unsubs.push(on("species:created", render));
  unsubs.push(on("species:updated", render));
  unsubs.push(on("species:deleted", render));
  unsubs.push(on("sites:created", render));
  unsubs.push(on("sites:deleted", render));
  await render();
}

export function unmount() {
  unsubs.forEach((u) => u());
  unsubs = [];
  containerRef = null;
}

async function render() {
  if (!containerRef) return;
  const [allSpecies, allSites, weeds, threatened] = await Promise.all([
    species.list(),
    sites.list(),
    loadReference("tas-weeds"),
    loadReference("tas-threatened"),
  ]);
  const siteMap = new Map(allSites.map((s) => [s.id, s.name]));

  if (allSites.length === 0) {
    containerRef.innerHTML = `
      <header class="view-header"><h1>Species</h1></header>
      <section class="panel">
        <p>Create a site first — species records belong to a site.</p>
        <a class="btn btn-primary" href="#/sites">Go to Sites</a>
      </section>`;
    return;
  }

  containerRef.innerHTML = `
    <header class="view-header"><h1>Species</h1></header>

    <section class="panel">
      <h2>Add species record</h2>
      <p class="help">Reference lists are advisory. ${escape(weeds.metadata.title)} (${escape(weeds.metadata.sourceDate)}).</p>
      <div class="reference-suggest">
        <label>Suggest from Tasmanian weed list
          <select id="weed-suggest">
            <option value="">—</option>
            ${weeds.items.map((it) => `<option value="${escape(it.scientificName)}">${escape(it.commonName)} — ${escape(it.scientificName)}</option>`).join("")}
          </select>
        </label>
        <label>Suggest from Tasmanian threatened list
          <select id="threat-suggest">
            <option value="">—</option>
            ${threatened.items.map((it) => `<option value="${escape(it.scientificName)}">${escape(it.commonName)} — ${escape(it.scientificName)}</option>`).join("")}
          </select>
        </label>
      </div>
      <div id="species-form-slot"></div>
    </section>

    <section class="panel">
      <h2>All species (${allSpecies.length})</h2>
      <table class="eco-table">
        <thead><tr>
          <th>Scientific name</th><th>Common name</th><th>Kingdom</th><th>Status</th><th>Site</th><th>Observed</th><th></th>
        </tr></thead>
        <tbody>
          ${allSpecies.length === 0
            ? `<tr><td colspan="7">No species recorded.</td></tr>`
            : allSpecies.slice().sort((a, b) => a.scientificName.localeCompare(b.scientificName)).map((s) => `
              <tr>
                <td><em>${escape(s.scientificName)}</em></td>
                <td>${escape(s.commonName || "")}</td>
                <td>${escape(s.kingdom)}</td>
                <td>${escape(s.status)}</td>
                <td>${escape(siteMap.get(s.siteId) || "—")}</td>
                <td>${escape(s.observedAt || "")}</td>
                <td class="row-actions">
                  <button class="btn btn-danger btn-sm" data-delete="${s.id}">Delete</button>
                </td>
              </tr>`).join("")}
        </tbody>
      </table>
    </section>
  `;

  // Build the form.
  const form = buildForm([
    { name: "siteId", label: "Site", type: "select",
      options: allSites.map((s) => ({ value: s.id, label: s.name })) },
    { name: "scientificName", label: "Scientific name", type: "text" },
    { name: "commonName", label: "Common name", type: "text" },
    { name: "kingdom", label: "Kingdom", type: "select", options: SPECIES_KINGDOMS, value: "flora" },
    { name: "status", label: "Status", type: "select", options: SPECIES_STATUSES, value: "native" },
    { name: "count", label: "Count", type: "number", min: 0, step: "1" },
    { name: "observedAt", label: "Observed on", type: "date" },
    { name: "habitat", label: "Habitat", type: "text" },
    { name: "notes", label: "Notes", type: "textarea" },
  ], {
    onSubmit: async (values) => {
      await species.create({
        ...values,
        source: "field_observation",
      });
      toast("Species saved", "success");
    },
  }).el;
  containerRef.querySelector("#species-form-slot").appendChild(form);

  // Wire the reference dropdowns into the form fields.
  const sciInput = form.querySelector('input[name="scientificName"]');
  const comInput = form.querySelector('input[name="commonName"]');
  containerRef.querySelector("#weed-suggest").addEventListener("change", (e) => {
    const val = e.target.value;
    if (!val) return;
    const item = weeds.items.find((i) => i.scientificName === val);
    if (item) {
      sciInput.value = item.scientificName;
      comInput.value = item.commonName || "";
    }
  });
  containerRef.querySelector("#threat-suggest").addEventListener("change", (e) => {
    const val = e.target.value;
    if (!val) return;
    const item = threatened.items.find((i) => i.scientificName === val);
    if (item) {
      sciInput.value = item.scientificName;
      comInput.value = item.commonName || "";
    }
  });

  containerRef.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this species record?")) return;
      await species.remove(btn.dataset.delete);
      toast("Species deleted", "info");
    });
  });
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
