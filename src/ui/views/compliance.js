import { complianceItems, COMPLIANCE_STATUSES } from "../../domain/compliance.js";
import { sites } from "../../domain/sites.js";
import { buildForm } from "../form.js";
import { toast } from "../toast.js";
import { on } from "../../core/bus.js";

let containerRef = null;
let unsubs = [];

export async function mount({ container }) {
  containerRef = container;
  ["compliance:created","compliance:updated","compliance:deleted","sites:created","sites:deleted"]
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
  const [all, allSites] = await Promise.all([complianceItems.list(), sites.list()]);
  const siteMap = new Map(allSites.map((s) => [s.id, s.name]));

  containerRef.innerHTML = `
    <header class="view-header">
      <h1>Compliance</h1>
      <p class="help">
        EcoTas does <strong>not</strong> assert that any legislation, standard, or framework has been satisfied.
        The items below are user-defined checklist records. Any claim of compliance is the user's responsibility
        and must be supported by the user's own evidence and professional advice.
      </p>
    </header>

    <section class="panel" id="comp-form-slot">
      <h2>Add checklist item</h2>
    </section>

    <section class="panel">
      <h2>All items (${all.length})</h2>
      <table class="eco-table">
        <thead><tr><th>Framework</th><th>Requirement</th><th>Status</th><th>Site</th><th>Review</th><th></th></tr></thead>
        <tbody>
          ${all.length === 0
            ? `<tr><td colspan="6">No checklist items yet.</td></tr>`
            : all.map((c) => `
              <tr>
                <td>${escape(c.framework)}</td>
                <td>${escape(c.requirement)}</td>
                <td>${escape(c.status)}</td>
                <td>${escape(siteMap.get(c.siteId) || "—")}</td>
                <td>${escape(c.reviewDate || "")}</td>
                <td class="row-actions"><button class="btn btn-danger btn-sm" data-delete="${c.id}">Delete</button></td>
              </tr>`).join("")}
        </tbody>
      </table>
    </section>
  `;

  const siteOptions = allSites.length === 0
    ? [{ value: "", label: "(no sites yet)" }]
    : allSites.map((s) => ({ value: s.id, label: s.name }));

  const form = buildForm([
    { name: "siteId", label: "Site", type: "select", options: siteOptions },
    { name: "framework", label: "Framework / source", type: "text",
      help: "e.g. your organisation's EMS, a client requirement, or a specific permit condition." },
    { name: "reference", label: "Reference (optional)", type: "text" },
    { name: "requirement", label: "Requirement", type: "text" },
    { name: "status", label: "Status", type: "select", options: COMPLIANCE_STATUSES, value: "not_started" },
    { name: "reviewDate", label: "Next review", type: "date" },
    { name: "evidence", label: "Evidence / notes", type: "textarea" },
  ], {
    onSubmit: async (values) => {
      if (!values.siteId) throw new Error("Create a site first");
      await complianceItems.create(values);
      toast("Checklist item saved", "success");
    },
  }).el;
  containerRef.querySelector("#comp-form-slot").appendChild(form);

  containerRef.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this checklist item?")) return;
      await complianceItems.remove(btn.dataset.delete);
      toast("Deleted", "info");
    });
  });
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
