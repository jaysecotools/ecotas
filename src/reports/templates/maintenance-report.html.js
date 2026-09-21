import { registerTemplate } from "../engine.js";

const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

registerTemplate("maintenance-report", ({ site, maintenance }) => {
  const now = Date.now();
  const overdue = maintenance.filter((m) =>
    m.dueDate && m.status !== "completed" && m.status !== "cancelled" &&
    new Date(m.dueDate).getTime() < now);

  return `
    <h1>Maintenance report — ${h(site.name)}</h1>
    <section>
      <h2>Summary</h2>
      <ul>
        <li>Total activities: ${maintenance.length}</li>
        <li>Overdue: ${overdue.length}</li>
        <li>Completed: ${maintenance.filter((m) => m.status === "completed").length}</li>
      </ul>
    </section>
    <section>
      <h2>Activity log</h2>
      <table>
        <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Priority</th><th>Due</th><th>Completed</th><th>Assignee</th></tr></thead>
        <tbody>
          ${maintenance.slice(0, 200).map((m) => `
            <tr>
              <td>${h(m.title)}</td>
              <td>${h(m.type)}</td>
              <td>${h(m.status)}</td>
              <td>${h(m.priority)}</td>
              <td>${h(m.dueDate || "")}</td>
              <td>${h(m.completedAt || "")}</td>
              <td>${h(m.assignee || "")}</td>
            </tr>`).join("") || `<tr><td colspan="7">None recorded.</td></tr>`}
        </tbody>
      </table>
    </section>
  `;
});
