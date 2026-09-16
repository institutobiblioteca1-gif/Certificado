import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "certificados_session";

function getSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error("APP_SECRET não configurado");
  return secret;
}

function sign(value: string): string {
  const h = createHmac("sha256", getSecret()).update(value).digest("hex");
  return `${value}.${h}`;
}

function verify(token: string): boolean {
  const idx = token.lastIndexOf(".");
  if (idx === -1) return false;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", getSecret()).update(value).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function createSessionToken(username: string): string {
  return sign(`${username}|${Date.now()}`);
}

export function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  return verify(token);
}

export const SESSION_COOKIE = COOKIE_NAME;

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return isValidToken(token);
}
