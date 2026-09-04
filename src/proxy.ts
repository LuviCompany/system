import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/session";

const PUBLIC_PATHS = ["/login"];

/**
 * Proteção de rotas (antigo "middleware"). Faz a checagem otimista de sessão
 * antes de qualquer página renderizar — usuário sem sessão válida nunca vê o
 * HTML de uma rota interna. `requireSession()` em cada layout/página é a
 * segunda camada de defesa (ex: token expira entre esta checagem e o render).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!session && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclui rotas de auth, internals do Next e QUALQUER arquivo estático
  // servido de /public (extensão no final do caminho — ex: /brand/logo.png,
  // favicon.ico, icon.png). Sem isso, o proxy tentava "proteger" imagens
  // públicas e as redirecionava para /login quando não autenticado.
  matcher: ["/((?!api/auth|_next/static|_next/image|.*\\.[^/]+$).*)"],
};
