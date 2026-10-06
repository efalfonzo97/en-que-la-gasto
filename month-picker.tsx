import Link from "next/link";
import { monthLabel, shiftMonth } from "@/lib/format";
import { withQuery } from "@/lib/view";

type Props = { month: string; basePath: string; query?: Record<string, string | undefined | null> };

export function MonthPicker({ month, basePath, query = {} }: Props) {
  return (
    <div className="flex items-center justify-between">
      <Link href={withQuery(basePath, { ...query, mes: shiftMonth(month, -1) })} className="btn-ghost px-3 py-1.5" aria-label="Mes anterior">
        ‹
      </Link>
      <span className="font-semibold">{monthLabel(month)}</span>
      <Link href={withQuery(basePath, { ...query, mes: shiftMonth(month, 1) })} className="btn-ghost px-3 py-1.5" aria-label="Mes siguiente">
        ›
      </Link>
    </div>
  );
}
