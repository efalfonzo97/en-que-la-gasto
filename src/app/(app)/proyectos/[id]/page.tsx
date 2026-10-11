import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { formatDay, formatMoney, today } from "@/lib/format";
import { getContributions, getProject } from "@/lib/queries";
import { contributionValue, projectProgress } from "@/lib/projects";
import { ProjectProgress } from "@/components/project-progress";
import { ContributionForm } from "@/components/contribution-form";

export default async function ProjectPage({ params, searchParams }: PageProps<"/proyectos/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const ctx = await getContext();
  const project = await getProject(ctx, id);
  if (!project) notFound();

  const contributions = await getContributions(ctx, [project.id]);
  const progress = projectProgress(project, contributions, ctx.members);
  const member = new Map(ctx.members.map((m) => [m.id, m]));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/proyectos" className="text-sm text-accent">‹ Proyectos</Link>
          <h1 className="truncate text-2xl font-bold">🎯 {project.title}</h1>
          <p className="text-sm text-muted">
            {project.for_member ? `De ${member.get(project.for_member)?.name}` : "Compartido"}
            {project.archived && " · archivado"}
          </p>
        </div>
        <Link href={`/proyectos/${project.id}/editar`} className="btn-ghost shrink-0 px-3 py-1.5 text-sm">Editar</Link>
      </div>

      {query.aporte && <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm">Aporte cargado ✓ También quedó como ahorro en movimientos.</p>}
      {project.description && <p className="text-sm">{project.description}</p>}

      <section className="card">
        <ProjectProgress project={project} progress={progress} meId={ctx.me.id} detailed />
      </section>

      {!project.archived && (
        <details className="card group" open={progress.contributions.length === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
            <span className="font-semibold">Cargar aporte</span>
            <span className="text-sm text-accent group-open:hidden">Mostrar</span>
            <span className="hidden text-sm text-accent group-open:inline">Ocultar</span>
          </summary>
          <div className="mt-3">
            <ContributionForm project={project} members={ctx.members} accounts={ctx.accounts} meId={ctx.me.id} today={today()} />
          </div>
        </details>
      )}

      <section className="card space-y-2">
        <h2 className="font-semibold">Aportes</h2>
        {progress.contributions.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay aportes.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {progress.contributions.map((t) => (
              <li key={t.id}>
                <Link href={`/movimientos/${t.id}`} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <span className="block font-medium">{t.paid_by ? member.get(t.paid_by)?.name : "—"}</span>
                    <span className="block text-xs text-muted">
                      {formatDay(t.date)}
                      {t.project_amount != null && t.currency !== project.currency && ` · pagado con ${formatMoney(t.amount, t.currency)}`}
                      {t.note && ` · ${t.note}`}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatMoney(contributionValue(t), project.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
