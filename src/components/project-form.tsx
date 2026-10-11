"use client";

import { useActionState } from "react";
import { saveProject, type ProjectFormState } from "@/app/(app)/proyectos/actions";
import type { Member, Project } from "@/lib/types";

type Props = { members: Member[]; project?: Project };

export function ProjectForm({ members, project }: Props) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveProject, {});
  return (
    <form action={action} className="space-y-4">
      {project && <input type="hidden" name="id" value={project.id} />}
      <div>
        <label className="label" htmlFor="title">Título</label>
        <input className="input" id="title" name="title" defaultValue={project?.title} placeholder="Ej: Viaje a Brasil" required />
      </div>
      <div>
        <label className="label" htmlFor="description">Descripción</label>
        <textarea
          className="input min-h-20"
          id="description"
          name="description"
          defaultValue={project?.description}
          placeholder="Ej: Vacaciones de enero, pasajes y alojamiento"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="label" htmlFor="target_amount">Ahorro estimado (objetivo)</label>
          <input
            className="input text-xl font-semibold"
            id="target_amount"
            name="target_amount"
            inputMode="decimal"
            placeholder="0"
            defaultValue={project ? String(project.target_amount).replace(".", ",") : ""}
            required
          />
        </div>
        <div className="w-24">
          <label className="label" htmlFor="currency">Moneda</label>
          <select className="input" id="currency" name="currency" defaultValue={project?.currency ?? "ARS"}>
            <option value="ARS">$</option>
            <option value="USD">US$</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="for_member">De quién es</label>
        <select className="input" id="for_member" name="for_member" defaultValue={project?.for_member ?? "compartido"}>
          <option value="compartido">Compartido</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>Solo {m.name}</option>
          ))}
        </select>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>
        {project ? "Guardar cambios" : "Crear proyecto"}
      </button>
    </form>
  );
}
