import fs from "node:fs";
import { cover } from "./cover.js";
import { order } from "./order.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/priority.json", "utf8"));
const result = cover(spec.spans || []);
const planned = order(spec.spans || [], spec.budget);
const view = render(spec);

emit("胜出的区间 =", JSON.stringify(result.winners));
emit("被完全盖住的区间 =", JSON.stringify(result.covered));
emit("重叠对数 =", result.overlaps);
emit("绘制顺序 =", JSON.stringify(planned.order));
emit("超预算被丢弃的区间 =", JSON.stringify(planned.dropped));
emit("预算消耗 =", planned.used);
emit("绘制预算 =", spec.budget);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  const bad = cover([{ id: "s0", start: 5, end: 1, priority: 1 }]);
  emit("区间顺序错误的错误码", bad.winners.length ? (bad.code || "no-code") : "no-error");
} catch (error) {
  emit("区间顺序错误的错误码", error.code || error.message);
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "胜出的区间": [
    "s1",
    "s3",
    "s4"
  ],
  "被完全盖住的区间": [],
  "重叠对数": 3,
  "绘制顺序": [
    "s3",
    "s1",
    "s4"
  ],
  "超预算被丢弃的区间": [
    "s0",
    "s2"
  ],
  "预算消耗": 3,
  "绘制预算": 3
};
// 有的值在收进来之前已经 stringify 过，比较前先试着解析回来，避免类型错配把正确实现判成不过。
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { /* 不是 JSON 就按原文比 */ }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (__same(got, want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
