import type { Member, Project, Transaction } from "@/lib/types";

/** Lo que suma un aporte al proyecto, en la moneda del proyecto. */
export function contributionValue(t: Pick<Transaction, "amount" | "project_amount">) {
  return t.project_amount ?? t.amount;
}

/** Avance del proyecto y cuánto puso cada miembro. */
export function projectProgress(project: Project, contributions: Transaction[], members: Member[]) {
  const own = contributions.filter((t) => t.project_id === project.id);
  const total = own.reduce((s, t) => s + contributionValue(t), 0);
  const pct = project.target_amount > 0 ? Math.min((total / project.target_amount) * 100, 100) : 0;
  const perMember = members
    .map((m) => {
      const amount = own.filter((t) => t.paid_by === m.id).reduce((s, t) => s + contributionValue(t), 0);
      return {
        member: m,
        amount,
        /** Del total aportado */
        pctOfTotal: total > 0 ? (amount / total) * 100 : 0,
        /** Del objetivo */
        pctOfTarget: project.target_amount > 0 ? (amount / project.target_amount) * 100 : 0,
      };
    })
    .filter((p) => p.amount > 0 || !project.for_member || project.for_member === p.member.id);
  return {
    contributions: own,
    total,
    pct,
    remaining: Math.max(project.target_amount - total, 0),
    done: project.target_amount > 0 && total >= project.target_amount,
    perMember,
  };
}
