type Props = {
  /** Porcentaje a mostrar (0 a 100; si pasa de 100 el anillo queda lleno). */
  pct: number | null;
  color: string;
  label: string;
  /** Texto chico debajo del título, por ejemplo un monto. */
  detail?: string;
  size?: "sm" | "xs";
};

/** Anillo de porcentaje con el valor en el centro. */
export function Gauge({ pct, color, label, detail, size = "sm" }: Props) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const value = pct === null ? 0 : Math.min(Math.max(pct, 0), 100);
  const text = pct === null ? "—" : `${Math.round(pct)}%`;

  return (
    <figure className="flex min-w-0 items-center gap-3">
      <svg
        viewBox="0 0 100 100"
        className={`shrink-0 ${size === "xs" ? "h-16 w-16" : "h-20 w-20"}`}
        role="img"
        aria-label={`${label}: ${text}`}
      >
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
        {value > 0 && (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * c} ${c}`}
            transform="rotate(-90 50 50)"
          />
        )}
        <text x="50" y="57" textAnchor="middle" className="fill-foreground" style={{ fontSize: 22, fontWeight: 700 }}>
          {text}
        </text>
      </svg>
      <figcaption className="min-w-0 text-sm">
        <span className="block break-words font-medium leading-tight">{label}</span>
        {detail && <span className="block text-xs text-muted tabular-nums">{detail}</span>}
      </figcaption>
    </figure>
  );
}
