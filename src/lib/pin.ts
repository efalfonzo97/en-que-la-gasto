import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (pin: string, salt: Buffer, keylen: number) => Promise<Buffer>;

/** Las cuentas con PIN tienen un email inventado con este dominio (nunca se le escribe). */
export const PIN_EMAIL_DOMAIN = "pin.en-que-la-gasto.app";

export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export const pinEmail = () => `${randomUUID()}@${PIN_EMAIL_DOMAIN}`;
export const isPinEmail = (email?: string | null) => !!email?.endsWith(`@${PIN_EMAIL_DOMAIN}`);

export const cleanName = (name: string) => name.trim().replace(/\s+/g, " ");

/** null si el PIN es válido, o el mensaje de error. */
export function pinError(pin: string): string | null {
  return /^\d{4,6}$/.test(pin) ? null : "El PIN tiene que ser de 4 a 6 números.";
}

export async function hashPin(pin: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(pin, salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPin(pin: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scryptAsync(pin, Buffer.from(salt, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}
