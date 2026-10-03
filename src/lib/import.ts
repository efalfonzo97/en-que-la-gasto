// Convierte las filas de la hoja "Cuentas" del Excel en movimientos y gastos fijos.
// Las filas con fecha son movimientos; las filas sin fecha son la plantilla de fijos del mes.

export type ImportedTransaction = {
  date: string;
  type: "ingreso" | "egreso";
  status: "pagado" | "pendiente";
  paidBy: string | null;
  forMember: string | null; // null = compartido
  description: string;
  amount: number;
  account: string | null;
  category: string;
};

export type ImportedFixed = Omit<ImportedTransaction, "date" | "type" | "status">;

export type ImportResult = {
  transactions: ImportedTransaction[];
  fixed: ImportedFixed[];
  skipped: string[];
};

type Cell = unknown;

const CATEGORY_KEYWORDS: [string, string[]][] = [
  ["Sueldo", ["sueldo", "aguinaldo", "bono"]],
  ["Vivienda", ["alquiler", "expensa", "gas", "luz", "edenor", "edesur", "agua", "aysa", "telecentro", "internet", "ivess", "abl"]],
  ["Comida", ["super", "verduler", "mercader", "carnicer", "almacen", "chino", "panader", "dietetica"]],
  ["Auto", ["auto", "combustible", "nafta", "service", "seguro", "vtv", "telepase", "peaje", "estacionamiento"]],
  ["Deudas", ["prestamo", "préstamo", "cuota", "tarjeta"]],
  ["Suscripciones", ["netflix", "hbo", "disney", "spotify", "google one", "youtube", "amazon", "prime", "icloud", "paramount"]],
  ["Celular", ["tuenti", "personal", "claro", "movistar", "celular"]],
  ["Educación", ["ingles", "inglés", "curso", "facultad", "colegio"]],
  ["Salidas y ocio", ["cine", "cinemark", "fulbo", "futbol", "fútbol", "salida", "bar", "restaurant", "delivery", "pedidos ya", "rappi"]],
  ["Hogar", ["mueble", "deco", "electro", "ferreter"]],
  ["Personal y regalos", ["cartera", "ropa", "regalo", "zapatilla", "peluquer"]],
];

const ACCOUNT_ALIASES: Record<string, string> = {
  mercadopago: "Mercado Pago",
  "mercado pago": "Mercado Pago",
  mp: "Mercado Pago",
  banco: "Banco",
  transferencia: "Transferencia",
  efectivo: "Efectivo",
};

export function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function guessCategory(description: string, type: "ingreso" | "egreso") {
  const text = normalize(description);
  for (const [category, words] of CATEGORY_KEYWORDS) {
    if (category === "Sueldo" && type !== "ingreso") continue;
    if (words.some((w) => text.includes(normalize(w)))) return category;
  }
  return type === "ingreso" ? "Otros ingresos" : "Otros";
}

function toText(value: Cell) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function toDate(value: Cell): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "string") {
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const ar = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ar) return `${ar[3]}-${ar[2].padStart(2, "0")}-${ar[1].padStart(2, "0")}`;
  }
  return null;
}

function toAmount(value: Cell): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.abs(value);
  if (typeof value === "string") return parseAmount(value);
  return null;
}

/** Acepta "12.000", "12.000,50", "12000.5" y "$ 12.000". */
export function parseAmount(raw: string): number | null {
  let text = raw.replace(/[$\s]/g, "");
  if (!text) return null;
  if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, "");
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseCuentasSheet(rows: Cell[][]): ImportResult {
  const result: ImportResult = { transactions: [], fixed: [], skipped: [] };
  const headerIndex = rows.findIndex((r) => {
    const names = r.map((c) => normalize(toText(c)));
    return names.includes("fecha") && names.includes("importe");
  });
  if (headerIndex === -1) {
    result.skipped.push("No encontré la fila de títulos (Fecha, Tipo, Importe...).");
    return result;
  }

  const header = rows[headerIndex].map((c) => normalize(toText(c)));
  const col = (...names: string[]) => header.findIndex((h) => names.some((n) => h.startsWith(n)));
  const c = {
    date: col("fecha"),
    type: col("tipo"),
    status: col("estado"),
    who: col("quien"),
    forWho: col("clase", "para"),
    description: col("descripcion", "concepto"),
    amount: col("importe", "monto"),
    account: col("metodo", "medio", "cuenta"),
  };

  for (const row of rows.slice(headerIndex + 1)) {
    const get = (i: number) => (i >= 0 ? row[i] : null);
    const description = toText(get(c.description));
    const typeText = normalize(toText(get(c.type)));
    if (!description && !typeText) continue;

    const type = typeText.startsWith("ingreso") ? "ingreso" : "egreso";
    const forText = toText(get(c.forWho));
    const accountText = toText(get(c.account));
    const base = {
      paidBy: toText(get(c.who)) || null,
      forMember: !forText || normalize(forText) === "compartido" ? null : forText,
      description,
      account: accountText ? (ACCOUNT_ALIASES[normalize(accountText)] ?? accountText) : null,
      category: guessCategory(description, type),
    };
    const amount = toAmount(get(c.amount));
    const date = toDate(get(c.date));

    if (date) {
      if (amount === null) {
        result.skipped.push(`${description}: el importe no es un número.`);
        continue;
      }
      const pending = normalize(toText(get(c.status))) === "pendiente";
      result.transactions.push({ ...base, date, type, status: pending ? "pendiente" : "pagado", amount });
    } else if (type === "egreso") {
      result.fixed.push({ ...base, amount: amount ?? 0 });
    } else {
      result.skipped.push(`${description}: ingreso sin fecha.`);
    }
  }
  return result;
}
