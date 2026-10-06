"use client";

import { useActionState, useState } from "react";
import { saveTransaction, type FormState } from "@/app/(app)/actions";
import type { Account, Category, Member, Transaction, TxType } from "@/lib/types";
import { parseAmount } from "@/lib/import";
import { SplitField } from "@/components/split-field";

type Props = {
  members: Member[];
  categories: Category[];
  accounts: Account[];
  meId: string;
  today: string;
  transaction?: Transaction;
};

const TYPES: { value: TxType; label: string }[] = [
  { value: "egreso", label: "Gasto" },
  { value: "ingreso", label: "Ingreso" },
  { value: "transferencia", label: "Ahorro / transferencia" },
];

export function TransactionForm({ members, categories, accounts, meId, today, transaction: tx }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTransaction, {});
  const [type, setType] = useState<TxType>(tx?.type ?? "egreso");
  const kind = type === "ingreso" ? "ingreso" : "egreso";
  const visibleCategories = categories.filter(
    (c) => c.kind === kind && (!c.archived || c.id === tx?.category_id),
  );
  const activeAccounts = accounts.filter((a) => !a.archived || a.id === tx?.account_id);
  const initialFor = (t: TxType) => (tx && tx.type === t ? (tx.for_member ?? "compartido") : t === "ingreso" ? meId : "compartido");
  const [forMember, setForMember] = useState(() => initialFor(tx?.type ?? "egreso"));
  const [amountText, setAmountText] = useState(tx ? String(tx.amount).replace(".", ",") : "");
  const showSplit = type === "egreso" && forMember === "compartido";

  function changeType(t: TxType) {
    setType(t);
    setForMember(initialFor(t));
  }

  return (
    <form action={action} className="space-y-5">
      {tx && <input type="hidden" name="id" value={tx.id} />}

      <fieldset className="flex flex-wrap gap-2">
        <legend className="label">Tipo</legend>
        {TYPES.map((t) => (
          <label key={t.value} className="chip cursor-pointer">
            <input
              type="radio"
              name="type"
              value={t.value}
              checked={type === t.value}
              onChange={() => changeType(t.value)}
              className="sr-only"
            />
            {t.label}
          </label>
        ))}
      </fieldset>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="label" htmlFor="amount">Importe</label>
          <input
            className="input text-2xl font-semibold"
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="0"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            autoFocus={!tx}
            required
          />
        </div>
        <div className="w-24">
          <label className="label" htmlFor="currency">Moneda</label>
          <select className="input" id="currency" name="currency" defaultValue={tx?.currency ?? "ARS"}>
            <option value="ARS">$</option>
            <option value="USD">US$</option>
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="label">Categoría</legend>
        <div className="flex flex-wrap gap-2">
          {visibleCategories.map((c) => (
            <label key={c.id} className="chip cursor-pointer">
              <input
                type="radio"
                name="category_id"
                value={c.id}
                defaultChecked={tx?.category_id === c.id}
                className="sr-only"
              />
              {c.emoji} {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="description">Descripción</label>
        <input className="input" id="description" name="description" defaultValue={tx?.description} placeholder="Ej: Supermercado" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="paid_by">{type === "ingreso" ? "Lo cobró" : "Pagó"}</label>
          <select className="input" id="paid_by" name="paid_by" defaultValue={tx ? (tx.paid_by ?? "") : meId}>
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
        <div>
          <label className="label" htmlFor="date">Fecha</label>
          <input className="input" id="date" name="date" type="date" defaultValue={tx?.date ?? today} />
        </div>
        <div>
          <label className="label" htmlFor="account_id">Medio de pago</label>
          <select className="input" id="account_id" name="account_id" defaultValue={tx ? (tx.account_id ?? "") : (activeAccounts.find((a) => a.name === "Mercado Pago") ?? activeAccounts[0])?.id ?? ""}>
            <option value="">Sin especificar</option>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {showSplit && (
        <SplitField members={members} defaultShares={tx?.shares ?? null} amount={parseAmount(amountText)} />
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="pending" defaultChecked={tx?.status === "pendiente"} className="h-4 w-4" />
        Todavía no está pagado (pendiente)
      </label>

      <div>
        <label className="label" htmlFor="note">Nota</label>
        <input className="input" id="note" name="note" defaultValue={tx?.note ?? ""} />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>
        {tx ? "Guardar cambios" : "Guardar"}
      </button>
    </form>
  );
}
