import { registerTemplate } from "../engine.js";

const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

registerTemplate("monitoring-summary", ({ site, observations }) => {
  const byType = {};
  for (const o of observations) byType[o.type] = (byType[o.type] || 0) + 1;

  return `
    <h1>Monitoring summary — ${h(site.name)}</h1>
    <section>
      <h2>Counts by type</h2>
      <table>
        <thead><tr><th>Type</th><th>Count</th></tr></thead>
        <tbody>
          ${Object.entries(byType).map(([k, v]) => `<tr><td>${h(k)}</td><td>${v}</td></tr>`).join("") || `<tr><td colspan="2">No observations.</td></tr>`}
        </tbody>
      </table>
    </section>
    <section>
      <h2>Observation log</h2>
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>Observer</th><th>Location</th><th>Notes</th></tr></thead>
        <tbody>
          ${observations.slice(0, 200).map((o) => `
            <tr>
              <td>${h(o.observedAt)}</td>
              <td>${h(o.type)}</td>
              <td>${h(o.observer)}</td>
              <td>${o.location ? h(o.location.lat) + ", " + h(o.location.lng) : "—"}</td>
              <td>${h(o.notes || "")}</td>
            </tr>`).join("") || `<tr><td colspan="5">None recorded.</td></tr>`}
        </tbody>
      </table>
    </section>
  `;
});
