import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { usuario, senha } = await req.json();

  const usuarioOk = usuario === process.env.ADMIN_USER;
  const senhaOk = senha === process.env.ADMIN_PASS;

  if (!usuarioOk || !senhaOk) {
    return NextResponse.json({ error: "Usuário ou senha inválidos" }, { status: 401 });
  }

  const token = createSessionToken(usuario);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return res;
}
