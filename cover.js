// cover.js：覆盖判定（基线：不比较优先级、全部保留）
export function cover(spans) {
  return { winners: spans.map((span) => span.id), covered: [], overlaps: 0 };
}
