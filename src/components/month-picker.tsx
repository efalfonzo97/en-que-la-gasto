import Link from "next/link";
import { monthLabel, shiftMonth } from "@/lib/format";

export function MonthPicker({ month, basePath }: { month: string; basePath: string }) {
  return (
    <div className="flex items-center justify-between">
      <Link href={`${basePath}?mes=${shiftMonth(month, -1)}`} className="btn-ghost px-3 py-1.5" aria-label="Mes anterior">
        ‹
      </Link>
      <span className="font-semibold">{monthLabel(month)}</span>
      <Link href={`${basePath}?mes=${shiftMonth(month, 1)}`} className="btn-ghost px-3 py-1.5" aria-label="Mes siguiente">
        ›
      </Link>
    </div>
  );
}
