import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { isMetaConfigured, listMissingMetaEnvVars } from "@/server/integrations/meta/config";
import { buildMetaAuthUrl } from "@/server/integrations/meta/oauth";
import { signMetaOAuthState } from "@/server/integrations/meta/state";

/**
 * Etapa 6 — botão "Conectar" já aponta pra cá (mesmo formato de
 * /api/integrations/google-ads/connect), mas como nenhuma credencial da
 * Meta existe nesta instalação (de propósito — item 20), esta rota sempre
 * redireciona de volta com o erro "não configurado", sem nunca chegar a
 * montar uma URL real de autorização.
 */
export async function GET(request: NextRequest) {
  const session = await requireSession();

  const clientId = request.nextUrl.searchParams.get("clientId");
  const platform = request.nextUrl.searchParams.get("platform");
  if (!clientId || (platform !== "ads" && platform !== "instagram")) {
    return NextResponse.json({ error: "clientId e platform (ads|instagram) são obrigatórios." }, { status: 400 });
  }

  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: session.organizationId } });
  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  if (!isMetaConfigured()) {
    const url = new URL(`/clientes/${clientId}/integracoes`, request.url);
    url.searchParams.set("erro", `meta_not_configured:${listMissingMetaEnvVars().join(",")}`);
    return NextResponse.redirect(url);
  }

  // Não alcançável nesta etapa (isMetaConfigured() é sempre false) — mantido
  // para quando a integração real for implementada.
  const state = await signMetaOAuthState({ organizationId: session.organizationId, clientId, userId: session.userId, scope: platform });
  return NextResponse.redirect(buildMetaAuthUrl(state));
}
