const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const usd = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatMoney(value: number, currency: "ARS" | "USD" = "ARS") {
  return (currency === "USD" ? usd : money).format(value);
}

export function formatDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

/** Mes en formato YYYY-MM, por defecto el actual (hora de Argentina). */
export function currentMonth() {
  return today().slice(0, 7);
}

export function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start, next };
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function isMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}
