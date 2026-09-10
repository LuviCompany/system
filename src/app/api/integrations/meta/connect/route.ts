import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { isMetaConfigured, listMissingMetaEnvVars, META_ADS_OAUTH_SCOPES } from "@/server/integrations/meta/config";
import { buildMetaAuthUrl } from "@/server/integrations/meta/oauth";
import { signMetaOAuthState } from "@/server/integrations/meta/state";

/**
 * Etapa 7 — Meta Ads é uma integração real (somente ads_read). Instagram
 * continua com a arquitetura pronta mas bloqueada explicitamente aqui,
 * ANTES de checar credenciais: o app Meta configurado para Ads não deve
 * nunca ser usado para iniciar um fluxo OAuth de Instagram nesta etapa
 * (ver plano — "Bloqueio explícito do Instagram").
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

  if (platform === "instagram") {
    const url = new URL(`/clientes/${clientId}/integracoes`, request.url);
    url.searchParams.set("erro", "meta_instagram_nao_implementado");
    return NextResponse.redirect(url);
  }

  if (!isMetaConfigured()) {
    const url = new URL(`/clientes/${clientId}/integracoes`, request.url);
    url.searchParams.set("erro", `meta_not_configured:${listMissingMetaEnvVars().join(",")}`);
    return NextResponse.redirect(url);
  }

  const state = await signMetaOAuthState({ organizationId: session.organizationId, clientId, userId: session.userId, scope: "ads" });
  return NextResponse.redirect(buildMetaAuthUrl(state, META_ADS_OAUTH_SCOPES));
}
