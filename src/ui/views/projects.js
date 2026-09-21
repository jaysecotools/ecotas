import { projects, PROJECT_STATUSES } from "../../domain/projects.js";
import { buildForm } from "../form.js";
import { toast } from "../toast.js";
import { on } from "../../core/bus.js";

let unsubs = [];
let containerRef = null;

export async function mount({ container }) {
  containerRef = container;
  unsubs.push(on("projects:created", render));
  unsubs.push(on("projects:updated", render));
  unsubs.push(on("projects:deleted", render));
  await render();
}

export function unmount() {
  unsubs.forEach((u) => u());
  unsubs = [];
}

async function render() {
  if (!containerRef) return;
  const rows = await projects.list();
  containerRef.innerHTML = `
    <header class="view-header"><h1>Projects</h1></header>
    <section class="panel" id="projects-form"></section>
    <section class="panel">
      <table class="eco-table">
        <thead><tr><th>Name</th><th>Status</th><th>Start</th><th></th></tr></thead>
        <tbody>
          ${rows.map((p) => `
            <tr>
              <td>${escape(p.name)}</td>
              <td>${escape(p.status)}</td>
              <td>${escape(p.startDate || "")}</td>
              <td class="row-actions">
                <button class="btn btn-danger btn-sm" data-delete="${p.id}">Delete</button>
              </td>
            </tr>`).join("") || `<tr><td colspan="4">No projects yet.</td></tr>`}
        </tbody>
      </table>
    </section>
  `;

  const form = buildForm([
    { name: "name", label: "Name", type: "text" },
    { name: "code", label: "Code", type: "text" },
    { name: "status", label: "Status", type: "select", options: PROJECT_STATUSES, value: "active" },
    { name: "startDate", label: "Start date", type: "date" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "budget", label: "Budget (AUD)", type: "number", min: 0, step: "0.01" },
    { name: "fundingSource", label: "Funding source", type: "text" },
  ], {
    onSubmit: async (values) => {
      await projects.create(values);
      toast("Project saved", "success");
    },
  }).el;
  containerRef.querySelector("#projects-form").appendChild(form);

  containerRef.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this project? Sites linked to it will remain and must be reassigned.")) return;
      await projects.remove(btn.dataset.delete);
      toast("Project deleted", "info");
    });
  });
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
