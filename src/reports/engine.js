import { buildProvenance } from "./provenance.js";

const TEMPLATES = new Map();

export function registerTemplate(id, renderFn) {
  TEMPLATES.set(id, renderFn);
}

export async function renderReport(id, context) {
  const tpl = TEMPLATES.get(id);
  if (!tpl) throw new Error(`Unknown report template: ${id}`);
  const provenance = buildProvenance(context.provenance || {});
  const html = await tpl({ ...context, provenance });
  return wrap(html, provenance);
}

function wrap(bodyHtml, provenance) {
  // A single canonical wrapper so print CSS applies consistently.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>EcoTas Report</title>
<link rel="stylesheet" href="../styles/print.css">
</head>
<body>
${bodyHtml}
<footer class="report-provenance">
  <h3>Provenance</h3>
  <dl>
    <dt>Application</dt><dd>${escape(provenance.app)} ${escape(provenance.appVersion || "")}</dd>
    <dt>Generated</dt><dd>${escape(provenance.generatedAt)}</dd>
    <dt>Actor</dt><dd>${escape(provenance.actor)}</dd>
    <dt>Record counts</dt>
    <dd><ul>${Object.entries(provenance.recordCounts)
      .map(([k, v]) => `<li>${escape(k)}: ${Number(v) || 0}</li>`).join("")}</ul></dd>
    ${provenance.missingData.length
      ? `<dt>Missing / unavailable</dt><dd><ul>${provenance.missingData
          .map((m) => `<li>${escape(m)}</li>`).join("")}</ul></dd>`
      : ""}
  </dl>
  <p class="disclaimer">${escape(provenance.disclaimer)}</p>
</footer>
</body>
</html>`;
}

function escape(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
