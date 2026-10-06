import Link from "next/link";
import type { View } from "@/lib/view";
import { withQuery } from "@/lib/view";

type Props = {
  view: View;
  path: string;
  query?: Record<string, string | undefined | null>;
  /** "iconos" para el inicio (casita y usuario), "texto" para movimientos. */
  variant?: "iconos" | "texto";
};

export function ViewToggle({ view, path, query = {}, variant = "texto" }: Props) {
  const options: { value: View; icon: string; label: string; title: string }[] = [
    { value: "hogar", icon: "🏠", label: "Compartidos", title: "Ver todo el hogar" },
    { value: "yo", icon: "👤", label: "Míos", title: "Ver solo lo mío" },
  ];

  if (variant === "iconos") {
    return (
      <div className="flex gap-1 rounded-full border border-border bg-surface p-1" role="group" aria-label="Qué ver">
        {options.map((o) => (
          <Link
            key={o.value}
            href={withQuery(path, { ...query, vista: o.value })}
            title={o.title}
            aria-label={o.title}
            aria-current={view === o.value ? "true" : undefined}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${view === o.value ? "bg-accent-soft ring-1 ring-accent" : "opacity-60"}`}
          >
            {o.icon}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1" role="group" aria-label="Qué ver">
      {options.map((o) => (
        <Link
          key={o.value}
          href={withQuery(path, { ...query, vista: o.value })}
          aria-current={view === o.value ? "true" : undefined}
          className={`rounded-lg py-1.5 text-center text-sm ${view === o.value ? "bg-accent-soft font-semibold text-accent" : "text-muted"}`}
        >
          {o.icon} {o.label}
        </Link>
      ))}
    </div>
  );
}
