import { NextResponse } from "next/server";

// Rota temporária de diagnóstico — NÃO expõe valores, só presença/tamanho.
// Remover depois de confirmar a causa do erro de AUTH_SECRET em produção.
export async function GET() {
  return NextResponse.json({
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
    authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}
