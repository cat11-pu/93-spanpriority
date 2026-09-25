// order.js：排序与预算（基线：不排序、不裁预算）
export function order(spans, budget) {
  return { order: spans.map((span) => span.id), dropped: [], used: spans.length };
}
