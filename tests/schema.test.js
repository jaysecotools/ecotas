import { test, assert, eq } from "./run-helpers.js";
import { S, validate } from "../src/core/schema.js";

test("string: required", () => {
  let threw = false;
  try { validate(S.string(), ""); } catch { threw = true; }
  assert(threw, "empty string should fail required");
});

test("string: trims and enforces max", () => {
  eq(validate(S.string({ max: 5 }), "  hello  "), "hello");
});

test("number: integer enforcement", () => {
  let threw = false;
  try { validate(S.number({ integer: true }), 1.5); } catch { threw = true; }
  assert(threw, "1.5 should fail integer");
});

test("enum: rejects invalid", () => {
  let threw = false;
  try { validate(S.enum(["a", "b"]), "c"); } catch { threw = true; }
  assert(threw, "'c' should fail enum");
});

test("date: normalises to ISO date", () => {
  eq(validate(S.date(), "2024-06-15"), "2024-06-15");
});

test("latLng: rejects out-of-range", () => {
  let threw = false;
  try { validate(S.latLng(), { lat: 91, lng: 0 }); } catch { threw = true; }
  assert(threw, "lat 91 should fail");
});

test("object: nests field errors", () => {
  let caught = null;
  try {
    validate(S.object({ name: S.string({ min: 2 }) }), { name: "x" });
  } catch (e) { caught = e; }
  assert(caught && /name:/.test(caught.message), "error should mention field name");
});
