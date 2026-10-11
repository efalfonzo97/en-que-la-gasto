import { formatMoney } from "@/lib/format";
import type { projectProgress } from "@/lib/projects";
import type { Project } from "@/lib/types";

export const PROJECT_MEMBER_COLORS = ["#2ea89a", "#8b5cf6", "#f5a524"];

type Progress = ReturnType<typeof projectProgress>;

/** Barra de avance con un tramo por persona, y el detalle de cada aporte. */
export function ProjectProgress({ project, progress, meId, detailed = false }: {
  project: Project;
  progress: Progress;
  meId: string;
  detailed?: boolean;
}) {
  const people = [...progress.perMember].sort((a, b) => Number(b.member.id === meId) - Number(a.member.id === meId));
  const color = (id: string) =>
    PROJECT_MEMBER_COLORS[people.findIndex((p) => p.member.id === id) % PROJECT_MEMBER_COLORS.length];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-lg font-bold tabular-nums">{formatMoney(progress.total, project.currency)}</span>
        <span className="text-sm text-muted tabular-nums">
          de {formatMoney(project.target_amount, project.currency)}
        </span>
      </div>
      <div
        className="flex h-3 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={Math.round(progress.pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(progress.pct)}% del objetivo`}
      >
        {people.map((p) => (
          <div
            key={p.member.id}
            className="h-full"
            style={{ width: `${Math.min(p.pctOfTarget, 100)}%`, background: color(p.member.id) }}
          />
        ))}
      </div>
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-accent">{progress.done ? "¡Objetivo cumplido! 🎉" : `${Math.round(progress.pct)}%`}</span>
        {!progress.done && (
          <span className="text-muted tabular-nums">Faltan {formatMoney(progress.remaining, project.currency)}</span>
        )}
      </div>
      {detailed && people.length > 0 && (
        <ul className="space-y-1.5 border-t border-border pt-2 text-sm">
          {people.map((p) => (
            <li key={p.member.id} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color(p.member.id) }} aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium">{p.member.id === meId ? `Vos (${p.member.name})` : p.member.name}</span>
              <span className="tabular-nums">{formatMoney(p.amount, project.currency)}</span>
              <span className="w-24 text-right text-xs text-muted tabular-nums">
                {Math.round(p.pctOfTarget)}% del obj.
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
