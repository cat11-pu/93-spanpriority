// cover.js：覆盖判定。
// - 被更高优先级区间完整包含的区间算被盖住（covered，不再绘制）；
// - 与更高优先级区间部分相交（互不完全包含）的区间被压下去，不算胜出；
// - 重叠对数 = 有交集但不构成完全包含的区间对数。
// 全程扫描线 + 线段树/树状数组，O(n log n)，不做两两比较。

const E_BAD_SPAN = "E_BAD_SPAN";

function badSpanError() {
  const error = new Error("span start must be less than span end");
  error.code = E_BAD_SPAN;
  return error;
}

// 区间最大值线段树：点更新取 max，闭区间查询 max。
function createMaxTree(size) {
  let base = 1;
  while (base < size) base *= 2;
  const tree = new Array(base * 2).fill(-Infinity);
  return {
    update(pos, value) {
      let i = pos + base;
      if (value <= tree[i]) return;
      tree[i] = value;
      for (i >>= 1; i >= 1; i >>= 1) {
        const merged = Math.max(tree[i * 2], tree[i * 2 + 1]);
        if (merged === tree[i]) break;
        tree[i] = merged;
      }
    },
    query(left, right) {
      let best = -Infinity;
      let lo = left + base;
      let hi = right + base;
      while (lo <= hi) {
        if (lo % 2 === 1) best = Math.max(best, tree[lo++]);
        if (hi % 2 === 0) best = Math.max(best, tree[hi--]);
        lo >>= 1;
        hi >>= 1;
      }
      return best;
    },
  };
}

// 树状数组：点更新计数，闭区间前缀和。
function createCounter(size) {
  const bit = new Array(size + 1).fill(0);
  return {
    add(pos, delta) {
      for (let i = pos + 1; i <= size; i += i & -i) bit[i] += delta;
    },
    sum(pos) {
      let total = 0;
      for (let i = pos + 1; i > 0; i -= i & -i) total += bit[i];
      return total;
    },
  };
}

function lowerBound(sorted, target) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function upperBound(sorted, target) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function cover(spans) {
  for (const span of spans) {
    if (!(span.start < span.end)) throw badSpanError();
  }
  const n = spans.length;
  if (n === 0) return { winners: [], covered: [], overlaps: 0 };

  const coords = Array.from(new Set(spans.flatMap((span) => [span.start, span.end]))).sort((a, b) => a - b);
  const last = coords.length - 1;
  const covered = new Array(n).fill(false);
  const defeated = new Array(n).fill(false);
  const indices = spans.map((_, index) => index);

  // 1) 被更高优先级区间完整包含 → covered。
  //    按 (起点升, 终点降, 优先级降) 扫描，保证任何容器都先于被包含者处理。
  const byContainment = indices.slice().sort((a, b) =>
    spans[a].start - spans[b].start ||
    spans[b].end - spans[a].end ||
    spans[b].priority - spans[a].priority ||
    a - b);
  const containTree = createMaxTree(coords.length);
  for (const index of byContainment) {
    const span = spans[index];
    const at = lowerBound(coords, span.end);
    if (containTree.query(at, last) > span.priority) covered[index] = true;
    containTree.update(at, span.priority);
  }

  // 2a) 左侧被压：存在更高优先级区间起点 < 自己起点、终点落在 (自己起点, 自己终点)。
  const byStart = indices.slice().sort((a, b) => spans[a].start - spans[b].start || a - b);
  const leftTree = createMaxTree(coords.length);
  let cursor = 0;
  for (const index of byStart) {
    const span = spans[index];
    while (cursor < n && spans[byStart[cursor]].start < span.start) {
      const other = spans[byStart[cursor]];
      leftTree.update(lowerBound(coords, other.end), other.priority);
      cursor += 1;
    }
    const lo = upperBound(coords, span.start);
    const hi = lowerBound(coords, span.end) - 1;
    if (lo <= hi && leftTree.query(lo, hi) > span.priority) defeated[index] = true;
  }

  // 2b) 右侧被压：存在更高优先级区间起点落在 (自己起点, 自己终点)、终点 > 自己终点。
  const byEndDesc = indices.slice().sort((a, b) => spans[b].end - spans[a].end || a - b);
  const rightTree = createMaxTree(coords.length);
  let cursorRight = 0;
  for (const index of byEndDesc) {
    const span = spans[index];
    while (cursorRight < n && spans[byEndDesc[cursorRight]].end > span.end) {
      const other = spans[byEndDesc[cursorRight]];
      rightTree.update(lowerBound(coords, other.start), other.priority);
      cursorRight += 1;
    }
    const lo = upperBound(coords, span.start);
    const hi = lowerBound(coords, span.end) - 1;
    if (lo <= hi && rightTree.query(lo, hi) > span.priority) defeated[index] = true;
  }

  // 3) 重叠对数 = 相交对数 - 完全包含对数，分别一次扫描计数。
  const endCounter = createCounter(coords.length);
  let intersecting = 0;
  let inserted = 0;
  let groupStart = 0;
  while (groupStart < n) {
    let groupEnd = groupStart;
    while (groupEnd < n && spans[byStart[groupEnd]].start === spans[byStart[groupStart]].start) groupEnd += 1;
    const size = groupEnd - groupStart;
    for (let k = groupStart; k < groupEnd; k++) {
      const span = spans[byStart[k]];
      const notTouching = endCounter.sum(upperBound(coords, span.start) - 1);
      intersecting += inserted - notTouching;
    }
    intersecting += (size * (size - 1)) / 2;
    for (let k = groupStart; k < groupEnd; k++) {
      endCounter.add(lowerBound(coords, spans[byStart[k]].end), 1);
    }
    inserted += size;
    groupStart = groupEnd;
  }

  const containCounter = createCounter(coords.length);
  let containing = 0;
  let seen = 0;
  for (const index of byContainment) {
    const span = spans[index];
    const at = lowerBound(coords, span.end);
    containing += seen - containCounter.sum(at - 1);
    containCounter.add(at, 1);
    seen += 1;
  }

  const winners = [];
  const coveredIds = [];
  for (let index = 0; index < n; index += 1) {
    if (covered[index]) coveredIds.push(spans[index].id);
    else if (!defeated[index]) winners.push(spans[index].id);
  }
  return { winners, covered: coveredIds, overlaps: intersecting - containing };
}
