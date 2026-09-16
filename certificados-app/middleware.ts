import { NextRequest, NextResponse } from "next/server";
import { isValidToken, SESSION_COOKIE } from "./lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publico =
    pathname === "/login" ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (publico) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidToken(token)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
