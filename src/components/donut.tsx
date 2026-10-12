import { formatCompact } from "@/lib/format";

export const CHART_COLORS = [
  "#4d8f2f", "#5ee04a", "#7a7a7a", "#f2444f", "#2ea89a", "#c93f7a",
  "#f5a524", "#3b82f6", "#8b5cf6", "#0f766e", "#e879a6", "#a3a3a3",
];

type Slice = { id: string; total: number; color?: string };

type Props = {
  slices: Slice[];
  total: number;
  /** Texto del centro. Por defecto el total abreviado. */
  center?: string;
  /** Texto chico debajo del centro. */
  caption?: string;
  size?: "lg" | "md" | "sm";
};

/** Gráfico de torta con el total en el centro. */
export function Donut({ slices, total, center, caption, size = "md" }: Props) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const visible = slices.filter((s) => s.total > 0);
  const gap = visible.length > 1 ? 2 : 0;
  const centerText = center ?? formatCompact(total);
  let offset = 0;

  return (
    <svg
      viewBox="0 0 200 200"
      className={`mx-auto block ${size === "sm" ? "h-36 w-36" : size === "lg" ? "h-60 w-60" : "h-52 w-52"}`}
      role="img"
      aria-label={caption ? `${caption} ${centerText}` : centerText}
    >
      <circle cx="100" cy="100" r={r} fill="none" stroke="var(--border)" strokeWidth="26" />
      {total > 0 &&
        slices.map((s, i) => {
          if (s.total <= 0) return null;
          const len = (s.total / total) * c;
          const dash = Math.max(len - gap, 0.5);
          const el = (
            <circle
              key={s.id}
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth="26"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 100 100)"
            />
          );
          offset += len;
          return el;
        })}
      <text
        x="100"
        y={caption ? 100 : 106}
        textAnchor="middle"
        className="fill-foreground"
        style={{ fontSize: size === "sm" ? 24 : 20, fontWeight: 600 }}
      >
        {centerText}
      </text>
      {caption && (
        <text x="100" y="122" textAnchor="middle" className="fill-muted" style={{ fontSize: 13 }}>
          {caption}
        </text>
      )}
    </svg>
  );
}
