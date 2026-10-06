"use client";

import { useActionState, useState } from "react";
import { saveFixed, type FormState } from "@/app/(app)/actions";
import type { Account, Category, FixedExpense, Member } from "@/lib/types";
import { parseAmount } from "@/lib/import";
import { SplitField } from "@/components/split-field";

type Props = {
  members: Member[];
  categories: Category[];
  accounts: Account[];
  fixed?: FixedExpense;
};

export function FixedForm({ members, categories, accounts, fixed }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveFixed, {});
  const [forMember, setForMember] = useState(fixed?.for_member ?? "compartido");
  const [amountText, setAmountText] = useState(fixed ? String(fixed.amount).replace(".", ",") : "");
  return (
    <form action={action} className="space-y-4">
      {fixed && <input type="hidden" name="id" value={fixed.id} />}
      <div>
        <label className="label" htmlFor="description">Descripción</label>
        <input className="input" id="description" name="description" defaultValue={fixed?.description} placeholder="Ej: Alquiler" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="amount">Importe estimado</label>
          <input
            className="input"
            id="amount"
            name="amount"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="due_day">Vence el día</label>
          <input className="input" id="due_day" name="due_day" type="number" min={1} max={31} defaultValue={fixed?.due_day ?? ""} />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="category_id">Categoría</label>
          <select className="input" id="category_id" name="category_id" defaultValue={fixed?.category_id ?? ""}>
            <option value="">Sin categoría</option>
            {categories
              .filter((c) => c.kind === "egreso" && (!c.archived || c.id === fixed?.category_id))
              .map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="paid_by">Lo paga</label>
          <select className="input" id="paid_by" name="paid_by" defaultValue={fixed?.paid_by ?? ""}>
            <option value="">Cualquiera</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="for_member">Para</label>
          <select className="input" id="for_member" name="for_member" value={forMember} onChange={(e) => setForMember(e.target.value)}>
            <option value="compartido">Compartido</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="account_id">Medio de pago</label>
          <select className="input" id="account_id" name="account_id" defaultValue={fixed?.account_id ?? ""}>
            <option value="">Sin especificar</option>
            {accounts
              .filter((a) => !a.archived || a.id === fixed?.account_id)
              .map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
          </select>
        </div>
      </div>
      {forMember === "compartido" && (
        <SplitField members={members} defaultShares={fixed?.shares ?? null} amount={parseAmount(amountText)} />
      )}
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>Guardar</button>
    </form>
  );
}
