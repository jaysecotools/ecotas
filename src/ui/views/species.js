// src/ui/views/species.js

import { species, SPECIES_KINGDOMS, SPECIES_STATUSES } from "../../domain/species.js";
import { sites } from "../../domain/sites.js";
import { loadReference } from "../../reference/index.js";
import { buildForm } from "../form.js";
import { toast } from "../toast.js";
import { on } from "../../core/bus.js";

var containerRef = null;
var unsubs = [];

export async function mount(context) {
  containerRef = context.container;
  unsubs.push(on("species:created", render));
  unsubs.push(on("species:updated", render));
  unsubs.push(on("species:deleted", render));
  unsubs.push(on("sites:created", render));
  unsubs.push(on("sites:deleted", render));
  await render();
}

export function unmount() {
  for (var i = 0; i < unsubs.length; i++) unsubs[i]();
  unsubs = [];
  containerRef = null;
}

async function render() {
  if (!containerRef) return;

  var results = await Promise.all([
    species.list(),
    sites.list(),
    loadReference("tas-weeds"),
    loadReference("tas-threatened")
  ]);
  var allSpecies = results[0];
  var allSites = results[1];
  var weeds = results[2];
  var threatened = results[3];

  var siteMap = {};
  for (var i = 0; i < allSites.length; i++) siteMap[allSites[i].id] = allSites[i].name;

  if (allSites.length === 0) {
    containerRef.innerHTML =
      '<header class="view-header"><h1>Species</h1></header>' +
      '<section class="panel">' +
        '<p>Create a site first - species records belong to a site.</p>' +
        '<a class="btn btn-primary" href="#/sites">Go to Sites</a>' +
      '</section>';
    return;
  }

  var sortedSpecies = allSpecies.slice().sort(function (a, b) {
    return a.scientificName.localeCompare(b.scientificName);
  });

  var speciesRows = "";
  if (sortedSpecies.length === 0) {
    speciesRows = '<tr><td colspan="7">No species recorded.</td></tr>';
  } else {
    for (var j = 0; j < sortedSpecies.length; j++) {
      var s = sortedSpecies[j];
      speciesRows +=
        '<tr>' +
          '<td><em>' + escape(s.scientificName) + '</em></td>' +
          '<td>' + escape(s.commonName || "") + '</td>' +
          '<td>' + escape(s.kingdom) + '</td>' +
          '<td>' + escape(s.status) + '</td>' +
          '<td>' + escape(siteMap[s.siteId] || "\u2014") + '</td>' +
          '<td>' + escape(s.observedAt || "") + '</td>' +
          '<td class="row-actions">' +
            '<button class="btn btn-danger btn-sm" data-delete="' + escape(s.id) + '">Delete</button>' +
          '</td>' +
        '</tr>';
    }
  }

  var weedOptions = '<option value="">\u2014</option>';
  for (var w = 0; w < weeds.items.length; w++) {
    var wi = weeds.items[w];
    weedOptions +=
      '<option value="' + escape(wi.scientificName) + '">' +
        escape(wi.commonName || wi.scientificName) + ' \u2014 ' + escape(wi.scientificName) +
      '</option>';
  }

  var threatOptions = '<option value="">\u2014</option>';
  for (var t = 0; t < threatened.items.length; t++) {
    var ti = threatened.items[t];
    threatOptions +=
      '<option value="' + escape(ti.scientificName) + '">' +
        escape(ti.commonName || ti.scientificName) + ' \u2014 ' + escape(ti.scientificName) +
      '</option>';
  }

  containerRef.innerHTML =
    '<header class="view-header"><h1>Species</h1></header>' +

    '<section class="panel">' +
      '<h2>Add species record</h2>' +
      '<p class="help">Reference lists are advisory. ' +
        escape(weeds.metadata.title) + ' (' + escape(weeds.metadata.sourceDate) + ').' +
      '</p>' +

      '<div class="reference-suggest">' +
        '<label>Suggest from Tasmanian weed list' +
          '<select id="weed-suggest">' + weedOptions + '</select>' +
        '</label>' +
        '<label>Suggest from Tasmanian threatened list' +
          '<select id="threat-suggest">' + threatOptions + '</select>' +
        '</label>' +
      '</div>' +

      '<div id="species-form-slot"></div>' +
    '</section>' +

    '<section class="panel">' +
      '<h2>All species (' + allSpecies.length + ')</h2>' +
      '<table class="eco-table">' +
        '<thead><tr>' +
          '<th>Scientific name</th><th>Common name</th><th>Kingdom</th>' +
          '<th>Status</th><th>Site</th><th>Observed</th><th></th>' +
        '</tr></thead>' +
        '<tbody>' + speciesRows + '</tbody>' +
      '</table>' +
    '</section>';

  var siteOptions = allSites.map(function (s) {
    return { value: s.id, label: s.name };
  });

  var built = buildForm([
    { name: "siteId", label: "Site", type: "select", options: siteOptions },
    { name: "scientificName", label: "Scientific name", type: "text" },
    { name: "commonName", label: "Common name", type: "text" },
    { name: "kingdom", label: "Kingdom", type: "select", options: SPECIES_KINGDOMS, value: "flora" },
    { name: "status", label: "Status", type: "select", options: SPECIES_STATUSES, value: "native" },
    { name: "count", label: "Count", type: "number", min: 0, step: "1" },
    { name: "observedAt", label: "Observed on", type: "date" },
    { name: "habitat", label: "Habitat", type: "text" },
    { name: "notes", label: "Notes", type: "textarea" }
  ], {
    onSubmit: async function (values) {
      values.source = "field_observation";
      await species.create(values);
      toast("Species saved", "success");
    }
  });

  var form = built.el;
  var slot = containerRef.querySelector("#species-form-slot");
  if (slot) slot.appendChild(form);

  var sciInput = form.querySelector("[name=scientificName]");
  var comInput = form.querySelector("[name=commonName]");

  if (!sciInput || !comInput) {
    // Defensive: if the form does not contain the expected inputs, do not
    // crash the whole view. Log so the developer sees it, and continue.
    // eslint-disable-next-line no-console
    console.warn("species: expected form inputs not found; reference autofill disabled");
  } else {
    wireReferenceDropdown(containerRef, "#weed-suggest", weeds, sciInput, comInput);
    wireReferenceDropdown(containerRef, "#threat-suggest", threatened, sciInput, comInput);
  }

  var deleteButtons = containerRef.querySelectorAll("[data-delete]");
  for (var d = 0; d < deleteButtons.length; d++) {
    deleteButtons[d].addEventListener("click", handleDelete);
  }
}

function wireReferenceDropdown(root, selector, reference, sciInput, comInput) {
  var sel = root.querySelector(selector);
  if (!sel) return;
  sel.addEventListener("change", function () {
    var value = sel.value;
    if (!value) return;
    var item = null;
    for (var i = 0; i < reference.items.length; i++) {
      if (reference.items[i].scientificName === value) {
        item = reference.items[i];
        break;
      }
    }
    if (!item) return;
    sciInput.value = item.scientificName;
    comInput.value = item.commonName || "";
  });
}

function handleDelete(e) {
  var id = e.currentTarget.getAttribute("data-delete");
  if (!id) return;
  if (!confirm("Delete this species record?")) return;
  species.remove(id).then(function () {
    toast("Species deleted", "info");
  });
}

function escape(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}