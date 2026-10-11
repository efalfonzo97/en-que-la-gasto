import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { getProject } from "@/lib/queries";
import { ProjectForm } from "@/components/project-form";
import { deleteProject, toggleProjectArchived } from "../../actions";

export default async function EditProjectPage({ params }: PageProps<"/proyectos/[id]/editar">) {
  const { id } = await params;
  const ctx = await getContext();
  const project = await getProject(ctx, id);
  if (!project) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Editar proyecto</h1>
      <ProjectForm members={ctx.members} project={project} />
      <form action={toggleProjectArchived}>
        <input type="hidden" name="id" value={project.id} />
        <input type="hidden" name="archived" value={String(project.archived)} />
        <button className="btn-ghost w-full">{project.archived ? "Volver a activarlo" : "Archivar proyecto"}</button>
      </form>
      <form action={deleteProject} className="space-y-1">
        <input type="hidden" name="id" value={project.id} />
        <button className="btn-ghost w-full text-danger">Borrar proyecto</button>
        <p className="text-center text-xs text-muted">Los aportes quedan cargados como ahorros comunes.</p>
      </form>
    </div>
  );
}
