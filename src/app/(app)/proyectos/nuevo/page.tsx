import { getContext } from "@/lib/data";
import { ProjectForm } from "@/components/project-form";

export default async function NewProjectPage() {
  const { members } = await getContext();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nuevo proyecto</h1>
      <ProjectForm members={members} />
    </div>
  );
}
