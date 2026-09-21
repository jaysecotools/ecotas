export function renderTable(columns, rows) {
  return `
    <table class="eco-table">
      <thead><tr>${columns.map((c) => `<th>${escape(c.label)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.length === 0
          ? `<tr><td colspan="${columns.length}">No records.</td></tr>`
          : rows.map((r) => `
              <tr>${columns.map((c) => `<td>${escape(c.get(r))}</td>`).join("")}</tr>
            `).join("")}
      </tbody>
    </table>`;
}

function escape(s) { return String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }