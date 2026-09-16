import { cookies } from "next/headers";

const COOKIE_NAME = "certificados_session";

function getSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error("APP_SECRET não configurado");
  return secret;
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(value: string): Promise<string> {
  const key = await getKey();
  const enc = new TextEncoder();
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return `${value}.${toHex(sigBuffer)}`;
}

async function verify(token: string): Promise<boolean> {
  const idx = token.lastIndexOf(".");
  if (idx === -1) return false;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = await sign(value);
  const expectedSig = expected.slice(expected.lastIndexOf(".") + 1);
  if (sig.length !== expectedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSessionToken(username: string): Promise<string> {
  return sign(`${username}|${Date.now()}`);
}

export async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return verify(token);
}

export const SESSION_COOKIE = COOKIE_NAME;

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return isValidToken(token);
}
