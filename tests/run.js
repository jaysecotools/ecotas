import "./schema.test.js";
import "./reference.test.js";
import { logger } from "../src/core/logger.js";

let passed = 0, failed = 0;
const results = [];

export function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: "pass" });
  } catch (err) {
    failed++;
    results.push({ name, status: "fail", error: err.message });
    logger.error(`FAIL: ${name}`, err);
  }
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

export function eq(a, b, msg) {
  if (a !== b) throw new Error(`${msg || "eq failed"}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
}

// Load test files, which register their tests via test().
await import("./schema.test.js");
await import("./reference.test.js");

console.log("\n--- EcoTas tests ---");
for (const r of results) console.log(`${r.status === "pass" ? "PASS" : "FAIL"}  ${r.name}${r.error ? " — " + r.error : ""}`);
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
