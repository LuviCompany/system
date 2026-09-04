import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { InvalidCredentialsError, login, UserInactiveError } from "@/server/auth/auth.service";
import { setSessionCookie } from "@/server/auth/session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    const token = await login(body as { email: string; password: string });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
    }
    if (error instanceof InvalidCredentialsError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof UserInactiveError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Não foi possível autenticar. Tente novamente." }, { status: 500 });
  }
}
