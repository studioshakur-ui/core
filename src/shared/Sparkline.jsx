import React from "react";
export default function Sparkline({ points = [10, 12, 11, 14, 18, 16, 22], w = 140, h = 40 }) {
  const max = Math.max(...points, 1),
    min = Math.min(...points, 0);
  const dx = w / (points.length - 1 || 1);
  const norm = (v) => h - ((v - min) / (max - min || 1)) * h;
  const d = points.map((p, i) => `${i ? "L" : "M"} ${i * dx} ${norm(p)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}
