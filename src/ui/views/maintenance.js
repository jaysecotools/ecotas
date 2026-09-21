import {
  maintenance,
  MAINTENANCE_TYPES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_PRIORITIES,
} from "../../domain/maintenance.js";
import { sites } from "../../domain/sites.js";
import { buildForm } from "../form.js";
import { toast } from "../toast.js";
import { on } from "../../core/bus.js";

let containerRef = null;
let unsubs = [];

export async function mount({ container }) {
  containerRef = container;
  ["maintenance:created","maintenance:updated","maintenance:deleted","sites:created","sites:deleted"]
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
  const [all, allSites] = await Promise.all([maintenance.list(), sites.list()]);
  const siteMap = new Map(allSites.map((s) => [s.id, s.name]));

  if (allSites.length === 0) {
    containerRef.innerHTML = `
      <header class="view-header"><h1>Maintenance</h1></header>
      <section class="panel"><p>Create a site first.</p><a class="btn btn-primary" href="#/sites">Go to Sites</a></section>`;
    return;
  }

  const now = Date.now();
  const overdue = all.filter((m) => m.dueDate && m.status !== "completed" && m.status !== "cancelled" && new Date(m.dueDate).getTime() < now);

  containerRef.innerHTML = `
    <header class="view-header"><h1>Maintenance</h1></header>

    <section class="panel" id="maint-form-slot">
      <h2>Add maintenance activity</h2>
    </section>

    <section class="panel">
      <h2>All activities (${all.length})${overdue.length ? ` — <span class="pill pill-warn">${overdue.length} overdue</span>` : ""}</h2>
      <table class="eco-table">
        <thead><tr><th>Title</th><th>Type</th><th>Site</th><th>Status</th><th>Priority</th><th>Due</th><th></th></tr></thead>
        <tbody>
          ${all.length === 0
            ? `<tr><td colspan="7">No maintenance scheduled.</td></tr>`
            : all.slice().sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")).map((m) => {
                const isOverdue = m.dueDate && m.status !== "completed" && m.status !== "cancelled" && new Date(m.dueDate).getTime() < now;
                return `
                  <tr>
                    <td>${escape(m.title)}</td>
                    <td>${escape(m.type)}</td>
                    <td>${escape(siteMap.get(m.siteId) || "—")}</td>
                    <td>${escape(m.status)}${isOverdue ? ` <span class="pill pill-warn">overdue</span>` : ""}</td>
                    <td>${escape(m.priority)}</td>
                    <td>${escape(m.dueDate || "")}</td>
                    <td class="row-actions">
                      ${m.status !== "completed"
                        ? `<button class="btn btn-sm" data-complete="${m.id}">Complete</button> `
                        : ""}
                      <button class="btn btn-danger btn-sm" data-delete="${m.id}">Delete</button>
                    </td>
                  </tr>`;
              }).join("")}
        </tbody>
      </table>
    </section>
  `;

  const form = buildForm([
    { name: "siteId", label: "Site", type: "select",
      options: allSites.map((s) => ({ value: s.id, label: s.name })) },
    { name: "title", label: "Title", type: "text" },
    { name: "type", label: "Type", type: "select", options: MAINTENANCE_TYPES, value: "weed_control" },
    { name: "status", label: "Status", type: "select", options: MAINTENANCE_STATUSES, value: "planned" },
    { name: "priority", label: "Priority", type: "select", options: MAINTENANCE_PRIORITIES, value: "medium" },
    { name: "dueDate", label: "Due date", type: "date" },
    { name: "assignee", label: "Assignee", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
  ], {
    onSubmit: async (values) => {
      await maintenance.create(values);
      toast("Maintenance activity saved", "success");
    },
  }).el;
  containerRef.querySelector("#maint-form-slot").appendChild(form);

  containerRef.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this maintenance activity?")) return;
      await maintenance.remove(btn.dataset.delete);
      toast("Deleted", "info");
    });
  });
  containerRef.querySelectorAll("[data-complete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await maintenance.update(btn.dataset.complete, {
        status: "completed",
        completedAt: new Date().toISOString().slice(0, 10),
      });
      toast("Marked as completed", "success");
    });
  });
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
