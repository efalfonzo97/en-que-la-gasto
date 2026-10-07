export type Member = {
  id: string;
  household_id: string;
  user_id: string | null;
  name: string;
  monthly_income: number;
};

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  currency: string;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  kind: "egreso" | "ingreso";
  essential: boolean;
  archived: boolean;
  sort: number;
};

export type Account = {
  id: string;
  name: string;
  currency: "ARS" | "USD";
  archived: boolean;
};

export type FixedExpense = {
  id: string;
  description: string;
  category_id: string | null;
  amount: number;
  due_day: number | null;
  paid_by: string | null;
  for_member: string | null;
  account_id: string | null;
  active: boolean;
  shares: Shares;
};

export type TxType = "ingreso" | "egreso" | "transferencia";

export type Transaction = {
  id: string;
  date: string;
  type: TxType;
  status: "pagado" | "pendiente";
  paid_by: string | null;
  for_member: string | null;
  category_id: string | null;
  description: string;
  amount: number;
  currency: "ARS" | "USD";
  account_id: string | null;
  fixed_expense_id: string | null;
  note: string | null;
  shares: Shares;
};

/** Porcentaje de cada miembro en un gasto compartido. null = partes iguales. */
export type Shares = Record<string, number> | null;
