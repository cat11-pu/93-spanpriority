// order.js：给可绘制区间定顺序并按预算裁剪。
// 被更高优先级区间完全包含的区间不可绘制（不得出现在 order 里）。
// 可绘制区间按优先级升序、同优先级按起点升序排列；预算不足时从优先级最低的开始丢弃。
// 覆盖判定用一次排序 + 树状数组（O(n log n)），十万区间也不做两两比较。
import { validateSpans } from "./cover.js";

// 树状数组前缀最大值；坐标按 end 反向下标后，前缀最大值即“end >= x 中见过的最大优先级”。
function prefixMax(tree, index) {
  let result = -Infinity;
  for (let i = index; i > 0; i -= i & -i) {
    if (tree[i] > result) result = tree[i];
  }
  return result;
}

function updateMax(tree, index, value) {
  for (let i = index; i < tree.length; i += i & -i) {
    if (value > tree[i]) tree[i] = value;
  }
}

function coveredIds(spans) {
  const order = spans.map((span, index) => index);
  order.sort((aIndex, bIndex) => {
    const a = spans[aIndex];
    const b = spans[bIndex];
    if (a.start !== b.start) return a.start - b.start;
    if (a.end !== b.end) return b.end - a.end;
    return b.priority - a.priority;
  });

  const ends = [...new Set(spans.map((span) => span.end))].sort((a, b) => a - b);
  const last = ends.length;
  const reverseRank = new Map(ends.map((end, i) => [end, last - i]));
  const tree = new Array(last + 1).fill(-Infinity);

  const covered = new Set();
  for (const index of order) {
    const span = spans[index];
    const rank = reverseRank.get(span.end);
    if (prefixMax(tree, rank) > span.priority) covered.add(span.id);
    updateMax(tree, rank, span.priority);
  }
  return covered;
}

export function order(spans, budget) {
  validateSpans(spans);

  const hidden = coveredIds(spans);
  const drawable = spans.filter((span) => !hidden.has(span.id));

  drawable.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.start !== b.start) return a.start - b.start;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const limit = Number.isFinite(budget)
    ? Math.max(0, Math.floor(budget))
    : drawable.length;

  // 升序排列后，预算不足时丢弃最前面的（优先级最低；同级起点最小）区间，保留尾部。
  const kept = drawable.slice(drawable.length - Math.min(limit, drawable.length));
  const keptIds = new Set(kept.map((span) => span.id));
  const dropped = spans
    .map((span) => span.id)
    .filter((id) => !hidden.has(id) && !keptIds.has(id));

  return {
    order: kept.map((span) => span.id),
    dropped,
    used: kept.length
  };
}
