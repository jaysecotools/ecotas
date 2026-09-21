// src/ui/form.js

export function buildForm(spec, options) {
  var onSubmit = options && options.onSubmit;
  var form = document.createElement("form");
  form.className = "eco-form";

  var fields = {};
  var order = [];

  for (var i = 0; i < spec.length; i++) {
    var field = spec[i];

    var wrap = document.createElement("label");
    wrap.className = "field";
    wrap.appendChild(document.createTextNode(field.label || field.name));

    var input = createInput(field);
    wrap.appendChild(input.el);
    form.appendChild(wrap);

    if (field.help) {
      var help = document.createElement("small");
      help.className = "help";
      help.textContent = field.help;
      wrap.appendChild(help);
    }

    fields[field.name] = input;
    order.push(field.name);
  }

  var submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "btn btn-primary";
  submit.textContent = "Save";
  form.appendChild(submit);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var values = {};
    for (var i = 0; i < order.length; i++) {
      var name = order[i];
      values[name] = fields[name].read();
    }
    if (typeof onSubmit === "function") {
      try {
        var result = onSubmit(values);
        if (result && typeof result.then === "function") {
          result.catch(function (err) {
            alert(err && err.message ? err.message : String(err));
          });
        }
      } catch (err) {
        alert(err && err.message ? err.message : String(err));
      }
    }
  });

  return {
    el: form,
    readValues: function () {
      var values = {};
      for (var i = 0; i < order.length; i++) {
        var name = order[i];
        values[name] = fields[name].read();
      }
      return values;
    }
  };
}

function createInput(field) {
  var el;

  if (field.type === "textarea") {
    el = document.createElement("textarea");
    el.rows = field.rows || 4;
    if (field.value !== undefined) el.value = field.value;
    el.name = field.name;
    return { el: el, read: function () { return trimOrUndefined(el.value); } };
  }

  if (field.type === "select") {
    el = document.createElement("select");
    var opts = Array.isArray(field.options) ? field.options : [];
    for (var i = 0; i < opts.length; i++) {
      var opt = opts[i];
      var o = document.createElement("option");
      if (typeof opt === "string") {
        o.value = opt;
        o.textContent = opt;
      } else {
        o.value = opt.value;
        o.textContent = opt.label != null ? opt.label : opt.value;
      }
      if (field.value === o.value) o.selected = true;
      el.appendChild(o);
    }
    el.name = field.name;
    return { el: el, read: function () { return el.value || undefined; } };
  }

  if (field.type === "number") {
    el = document.createElement("input");
    el.type = "number";
    if (field.step) el.step = field.step;
    if (field.min !== undefined) el.min = field.min;
    if (field.max !== undefined) el.max = field.max;
    if (field.value !== undefined) el.value = field.value;
    el.name = field.name;
    return { el: el, read: function () { return el.value === "" ? undefined : Number(el.value); } };
  }

  if (field.type === "date") {
    el = document.createElement("input");
    el.type = "date";
    if (field.value) el.value = field.value;
    el.name = field.name;
    return { el: el, read: function () { return el.value || undefined; } };
  }

  el = document.createElement("input");
  el.type = field.type || "text";
  if (field.value !== undefined) el.value = field.value;
  el.name = field.name;
  return { el: el, read: function () { return trimOrUndefined(el.value); } };
}

function trimOrUndefined(v) {
  if (v === undefined || v === null) return undefined;
  var t = String(v).trim();
  return t === "" ? undefined : t;
}