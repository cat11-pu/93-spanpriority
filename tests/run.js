import assert from "node:assert";
import fs from "node:fs";
import { cover } from "../cover.js";
import { order } from "../order.js";
import { render } from "../app.js";

let failed = 0;
let total = 0;
function check(name, fn) {
  total += 1;
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

const sample = JSON.parse(fs.readFileSync(new URL("../sample/priority.json", import.meta.url), "utf8"));

check("sample scenario matches acceptance", () => {
  const result = cover(sample.spans);
  assert.deepStrictEqual(result.winners, ["s1", "s3", "s4"]);
  assert.deepStrictEqual(result.covered, []);
  assert.strictEqual(result.overlaps, 3);
  const planned = order(sample.spans, sample.budget);
  assert.deepStrictEqual(planned.order, ["s3", "s1", "s4"]);
  assert.deepStrictEqual(planned.dropped, ["s0", "s2"]);
  assert.strictEqual(planned.used, 3);
});

check("bad span throws E_BAD_SPAN", () => {
  assert.throws(
    () => cover([{ id: "x", start: 5, end: 1, priority: 1 }]),
    (error) => error.code === "E_BAD_SPAN");
  assert.throws(
    () => cover([{ id: "x", start: 3, end: 3, priority: 1 }]),
    (error) => error.code === "E_BAD_SPAN");
});

check("covered spans never appear in draw order", () => {
  const tricky = [
    { id: "big", start: 0, end: 10, priority: 5 },
    { id: "inner", start: 2, end: 3, priority: 1 },
    { id: "solo", start: 20, end: 21, priority: 1 },
  ];
  const result = cover(tricky);
  assert.deepStrictEqual(result.covered, ["inner"]);
  const planned = order(tricky, 2);
  assert.ok(!planned.order.includes("inner"));
  assert.ok(planned.order.length <= 2);
});

check("draw count never exceeds budget", () => {
  const planned = order(sample.spans, 2);
  assert.ok(planned.order.length <= 2);
  assert.strictEqual(planned.used, planned.order.length);
  assert.strictEqual(planned.used + planned.dropped.length, sample.spans.length);
});

check("same input twice gives same output", () => {
  assert.deepStrictEqual(cover(sample.spans), cover(sample.spans));
  assert.deepStrictEqual(order(sample.spans, sample.budget), order(sample.spans, sample.budget));
});

check("render keeps the six-key shape", () => {
  const view = render(sample);
  assert.deepStrictEqual(
    Object.keys(view).sort(),
    ["budget_used", "covered", "dropped", "order", "overlaps", "winners"]);
});

console.log(total + " cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
