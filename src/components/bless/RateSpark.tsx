import { useMemo } from "react";
import type { RatePoint } from "@/lib/bless-store";

export function RateSpark({
  data,
  metal,
  height = 64,
}: {
  data: RatePoint[];
  metal: "gold" | "silver";
  height?: number;
}) {
  const { path, area, up } = useMemo(() => {
    if (data.length < 2) return { path: "", area: "", up: true };
    const vals = data.map((d) => d[metal]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const w = 200;
    const h = height;
    const step = w / (vals.length - 1);
    const pts = vals.map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return [x, y] as const;
    });
    const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
    const area = `${path} L ${w} ${h} L 0 ${h} Z`;
    return { path, area, up: vals[vals.length - 1] >= vals[0] };
  }, [data, metal, height]);

  const stroke = metal === "gold" ? "var(--color-gold)" : "var(--color-silver)";
  const trendColor = up ? "var(--color-success)" : "var(--color-destructive)";

  return (
    <svg viewBox={`0 0 200 ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${metal}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g-${metal})`} />
      <path d={path} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
