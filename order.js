// order.js：排序与预算。
// 可绘制（未被盖住）的区间按 (优先级升, 起点升) 排列；
// 超过预算的按优先级从低到高丢弃。同一输入结果恒定（幂等）。
import { cover } from "./cover.js";

export function order(spans, budget) {
  const result = cover(spans);
  const coveredIds = new Set(result.covered);
  const drawable = spans
    .map((span, index) => ({ span, index }))
    .filter((entry) => !coveredIds.has(entry.span.id));
  drawable.sort((a, b) =>
    a.span.priority - b.span.priority ||
    a.span.start - b.span.start ||
    a.span.end - b.span.end ||
    a.index - b.index);
  const limit = budget == null || !Number.isFinite(budget)
    ? drawable.length
    : Math.max(0, Math.min(Math.floor(budget), drawable.length));
  const kept = drawable.slice(drawable.length - limit);
  const dropped = drawable.slice(0, drawable.length - limit);
  return {
    order: kept.map((entry) => entry.span.id),
    dropped: dropped.map((entry) => entry.span.id),
    used: kept.length,
  };
}
