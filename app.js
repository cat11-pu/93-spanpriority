// app.js：渲染结果
import { cover } from "./cover.js";
import { order } from "./order.js";

export function render(spec) {
  const result = cover(spec.spans || []);
  const planned = order(spec.spans || [], spec.budget);
  return { winners: result.winners, covered: result.covered, overlaps: result.overlaps,
           order: planned.order, dropped: planned.dropped, budget_used: planned.used };
}
