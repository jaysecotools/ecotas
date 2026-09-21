export function buildForm(spec, { onSubmit }) {
  const form = document.createElement("form");
  form.className = "eco-form";

  const fields = {};
  for (const field of spec) {
    const wrap = document.createElement("label");
    wrap.className = "field";
    wrap.textContent = field.label;
    const input = createInput(field);
    wrap.appendChild(input.el);
    form.appendChild(wrap);
    if (field.help) {
      const help = document.createElement("small");
      help.className = "help";
      help.textContent = field.help;
      wrap.appendChild(help);
    }
    fields[field.name] = input;
  }

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "btn btn-primary";
  submit.textContent = "Save";
  form.appendChild(submit);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const values = {};
    for (const [name, f] of Object.entries(fields)) values[name] = f.read();
    try {
      await onSubmit(values);
    } catch (err) {
      alert(err.message || String(err));
    }
  });

  return { el: form, readValues: () => Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, f.read()])) };
}

function createInput(field) {
  if (field.type === "textarea") {
    const el = document.createElement("textarea");
    el.rows = field.rows || 4;
    if (field.value) el.value = field.value;
    return { el, read: () => el.value.trim() || undefined };
  }
  if (field.type === "select") {
    const el = document.createElement("select");
    for (const opt of field.options) {
      const o = document.createElement("option");
      o.value = typeof opt === "string" ? opt : opt.value;
      o.textContent = typeof opt === "string" ? opt : opt.label;
      if (field.value === o.value) o.selected = true;
      el.appendChild(o);
    }
    return { el, read: () => el.value || undefined };
  }
  if (field.type === "number") {
    const el = document.createElement("input");
    el.type = "number";
    if (field.step) el.step = field.step;
    if (field.min !== undefined) el.min = field.min;
    if (field.max !== undefined) el.max = field.max;
    if (field.value !== undefined) el.value = field.value;
    return { el, read: () => (el.value === "" ? undefined : Number(el.value)) };
  }
  if (field.type === "date") {
    const el = document.createElement("input");
    el.type = "date";
    if (field.value) el.value = field.value;
    return { el, read: () => el.value || undefined };
  }
  const el = document.createElement("input");
  el.type = field.type || "text";
  if (field.value !== undefined) el.value = field.value;
  return { el, read: () => el.value.trim() || undefined };
}
