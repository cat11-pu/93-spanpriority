// cover.js：按优先级判定覆盖关系。
// 被更高优先级区间完整包含（start 被 <=、end 被 >=，且优先级严格更高）的区间算 covered，不再绘制。
// overlaps 只统计有交集但不构成完全包含的区间对。
// winners 是在这种“非包含交集”里至少赢过一个更低优先级区间、且自身没被盖住的区间。
export function cover(spans) {
  validateSpans(spans);

  const coveredSet = new Set();
  for (let i = 0; i < spans.length; i += 1) {
    for (let j = 0; j < spans.length; j += 1) {
      if (i === j) continue;
      const a = spans[i];
      const b = spans[j];
      if (
        b.priority > a.priority &&
        b.start <= a.start &&
        b.end >= a.end
      ) {
        coveredSet.add(a.id);
        break;
      }
    }
  }

  let overlaps = 0;
  const winnerSet = new Set();
  for (let i = 0; i < spans.length; i += 1) {
    for (let j = i + 1; j < spans.length; j += 1) {
      const a = spans[i];
      const b = spans[j];
      const intersects = a.start < b.end && b.start < a.end;
      if (!intersects) continue;
      const contained =
        (a.start <= b.start && a.end >= b.end) ||
        (b.start <= a.start && b.end >= a.end);
      if (contained) continue;
      overlaps += 1;
      if (a.priority > b.priority) winnerSet.add(a.id);
      else if (b.priority > a.priority) winnerSet.add(b.id);
    }
  }

  const winners = spans
    .map((span) => span.id)
    .filter((id) => !coveredSet.has(id) && winnerSet.has(id));
  const covered = spans
    .map((span) => span.id)
    .filter((id) => coveredSet.has(id));

  return { winners, covered, overlaps };
}

export function validateSpans(spans) {
  if (!Array.isArray(spans)) {
    const error = new Error("E_BAD_SPAN: spans must be an array");
    error.code = "E_BAD_SPAN";
    throw error;
  }
  for (const span of spans) {
    if (
      span === null ||
      typeof span !== "object" ||
      typeof span.start !== "number" ||
      typeof span.end !== "number" ||
      !(span.start < span.end)
    ) {
      const error = new Error("E_BAD_SPAN: span start must be less than end");
      error.code = "E_BAD_SPAN";
      throw error;
    }
  }
}
