import assert from "node:assert";
import { cover } from "../cover.js";
import { order } from "../order.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const spans = [{ id: "s0", start: 0, end: 5, priority: 1 }, { id: "s1", start: 1, end: 2, priority: 2 }];

check("cover returns winners", () => {
  assert.ok(Array.isArray(cover(spans).winners));
});

check("cover reports overlaps", () => {
  assert.strictEqual(typeof cover(spans).overlaps, "number");
});

check("order returns order", () => {
  assert.ok(Array.isArray(order(spans, 2).order));
});

check("order reports dropped", () => {
  assert.ok(Array.isArray(order(spans, 2).dropped));
});

check("render exposes budget_used", () => {
  assert.strictEqual(typeof render({ spans: spans, budget: 2 }).budget_used, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
