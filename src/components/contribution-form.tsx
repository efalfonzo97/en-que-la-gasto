"use client";

import { useActionState } from "react";
import { addContribution, type ProjectFormState } from "@/app/(app)/proyectos/actions";
import type { Account, Member, Project } from "@/lib/types";

type Props = { project: Project; members: Member[]; accounts: Account[]; meId: string; today: string };

/** Cargar un aporte. Se guarda también como movimiento de ahorro. */
export function ContributionForm({ project, members, accounts, meId, today }: Props) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(addContribution, {});
  const isUsd = project.currency === "USD";
  const payers = project.for_member ? members.filter((m) => m.id === project.for_member) : members;
  const activeAccounts = accounts.filter((a) => !a.archived);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="project_id" value={project.id} />
      <div className={isUsd ? "grid grid-cols-2 gap-2" : ""}>
        <div>
          <label className="label" htmlFor="amount">{isUsd ? "US$ que suman" : "Importe"}</label>
          <input className="input text-xl font-semibold" id="amount" name="amount" inputMode="decimal" placeholder="0" required />
        </div>
        {isUsd && (
          <div>
            <label className="label" htmlFor="pesos">$ que salieron</label>
            <input className="input text-xl" id="pesos" name="pesos" inputMode="decimal" placeholder="Opcional" />
          </div>
        )}
      </div>
      {isUsd && (
        <p className="text-xs text-muted">
          Si compraste los dólares con pesos del mes, poné cuántos pesos usaste: eso es lo que se descuenta del disponible.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label" htmlFor="paid_by">Quién aporta</label>
          <select className="input" id="paid_by" name="paid_by" defaultValue={payers.some((m) => m.id === meId) ? meId : payers[0]?.id}>
            {payers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="date">Fecha</label>
          <input className="input" id="date" name="date" type="date" defaultValue={today} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="account_id">De dónde sale</label>
        <select className="input" id="account_id" name="account_id" defaultValue="">
          <option value="">Sin especificar</option>
          {activeAccounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="note">Nota</label>
        <input className="input" id="note" name="note" />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>Cargar aporte</button>
    </form>
  );
}
