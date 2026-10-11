import Link from "next/link";
import { getContext } from "@/lib/data";
import { getContributions, getProjects } from "@/lib/queries";
import { projectProgress } from "@/lib/projects";
import { ProjectProgress } from "@/components/project-progress";

export default async function ProjectsPage() {
  const ctx = await getContext();
  const projects = await getProjects(ctx);
  const contributions = projects.length ? await getContributions(ctx, projects.map((p) => p.id)) : [];
  const member = new Map(ctx.members.map((m) => [m.id, m]));
  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);

  const card = (p: (typeof projects)[number]) => (
    <li key={p.id}>
      <Link href={`/proyectos/${p.id}`} className={`card block space-y-3 ${p.archived ? "opacity-70" : ""}`}>
        <div>
          <p className="truncate font-semibold">🎯 {p.title}</p>
          <p className="text-xs text-muted">
            {p.for_member ? `De ${member.get(p.for_member)?.name}` : "Compartido"} · {p.currency === "USD" ? "en dólares" : "en pesos"}
          </p>
        </div>
        <ProjectProgress project={p} progress={projectProgress(p, contributions, ctx.members)} meId={ctx.me.id} />
      </Link>
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <Link href="/proyectos/nuevo" className="btn-ghost px-3 py-1.5 text-sm">+ Nuevo</Link>
      </div>
      <p className="text-sm text-muted">
        Objetivos para ahorrar juntos. Cada aporte se descuenta del disponible del mes como ahorro.
      </p>

      {active.length === 0 && (
        <div className="card space-y-3 text-center">
          <p className="text-muted">Todavía no hay proyectos. Empezá con uno, por ejemplo un viaje.</p>
          <Link href="/proyectos/nuevo" className="btn">Crear proyecto</Link>
        </div>
      )}
      <ul className="space-y-3">{active.map(card)}</ul>

      {archived.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none text-sm text-muted [&::-webkit-details-marker]:hidden">
            Archivados ({archived.length}) <span className="text-accent group-open:hidden">Mostrar</span>
            <span className="hidden text-accent group-open:inline">Ocultar</span>
          </summary>
          <ul className="mt-3 space-y-3">{archived.map(card)}</ul>
        </details>
      )}
    </div>
  );
}
