import { sites, SITE_STATUSES } from "../../domain/sites.js";
import { projects } from "../../domain/projects.js";
import { buildForm } from "../form.js";
import { toast } from "../toast.js";
import { on } from "../../core/bus.js";

let containerRef = null;
let unsubs = [];

export async function mount({ container }) {
  containerRef = container;
  unsubs.push(on("sites:created", render));
  unsubs.push(on("sites:updated", render));
  unsubs.push(on("sites:deleted", render));
  unsubs.push(on("projects:created", render));
  unsubs.push(on("projects:deleted", render));
  await render();
}

export function unmount() {
  unsubs.forEach((u) => u());
  unsubs = [];
  containerRef = null;
}

async function render() {
  if (!containerRef) return;
  const [allSites, allProjects] = await Promise.all([sites.list(), projects.list()]);
  const projectMap = new Map(allProjects.map((p) => [p.id, p.name]));

  if (allProjects.length === 0) {
    containerRef.innerHTML = `
      <header class="view-header"><h1>Sites</h1></header>
      <section class="panel">
        <p>Create a project first — sites belong to a project.</p>
        <a class="btn btn-primary" href="#/projects">Go to Projects</a>
      </section>`;
    return;
  }

  containerRef.innerHTML = `
    <header class="view-header"><h1>Sites</h1></header>

    <section class="panel" id="site-form-panel">
      <h2>Add site</h2>
    </section>

    <section class="panel">
      <h2>All sites</h2>
      <table class="eco-table">
        <thead><tr>
          <th>Name</th><th>Project</th><th>Status</th><th>NRM region</th><th>Area (ha)</th><th>Centre</th><th></th>
        </tr></thead>
        <tbody>
          ${allSites.length === 0
            ? `<tr><td colspan="7">No sites yet.</td></tr>`
            : allSites.map((s) => `
              <tr>
                <td>${escape(s.name)}</td>
                <td>${escape(projectMap.get(s.projectId) || "—")}</td>
                <td>${escape(s.status)}</td>
                <td>${escape(s.nrmRegion || "")}</td>
                <td>${s.areaHectares ?? ""}</td>
                <td>${s.centre ? `${s.centre.lat.toFixed(4)}, ${s.centre.lng.toFixed(4)}` : "—"}</td>
                <td class="row-actions">
                  <button class="btn btn-danger btn-sm" data-delete="${s.id}">Delete</button>
                </td>
              </tr>`).join("")}
        </tbody>
      </table>
    </section>
  `;

  const form = buildForm([
    { name: "projectId", label: "Project", type: "select",
      options: allProjects.map((p) => ({ value: p.id, label: p.name })) },
    { name: "name", label: "Site name", type: "text" },
    { name: "status", label: "Status", type: "select", options: SITE_STATUSES, value: "active" },
    { name: "nrmRegion", label: "NRM region", type: "text" },
    { name: "landTenure", label: "Land tenure", type: "text" },
    { name: "areaHectares", label: "Area (ha)", type: "number", min: 0, step: "0.01" },
    { name: "latitude", label: "Centre latitude", type: "number", step: "any" },
    { name: "longitude", label: "Centre longitude", type: "number", step: "any" },
    { name: "description", label: "Description", type: "textarea" },
  ], {
    onSubmit: async (values) => {
      const payload = {
        projectId: values.projectId,
        name: values.name,
        status: values.status,
        nrmRegion: values.nrmRegion,
        landTenure: values.landTenure,
        areaHectares: values.areaHectares,
        centre: { lat: Number(values.latitude), lng: Number(values.longitude) },
        boundary: [],
        description: values.description,
        address: undefined,
      };
      await sites.create(payload);
      toast("Site saved", "success");
    },
  }).el;
  containerRef.querySelector("#site-form-panel").appendChild(form);

  containerRef.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this site? Its species, observations, assessments, and maintenance records will remain and must be reviewed.")) return;
      await sites.remove(btn.dataset.delete);
      toast("Site deleted", "info");
    });
  });
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
