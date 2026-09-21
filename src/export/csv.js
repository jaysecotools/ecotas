export function toCSV(rows, columns) {
  const header = columns.join(",");
  const lines = rows.map((r) => columns.map((c) => csvCell(r[c])).join(","));
  return [header, ...lines].join("\n");
}

function csvCell(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
