import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { isGoogleAdsConfigured, listMissingGoogleAdsEnvVars } from "@/server/integrations/google-ads/config";
import { buildGoogleAdsAuthUrl } from "@/server/integrations/google-ads/oauth";
import { signOAuthState } from "@/server/integrations/google-ads/state";

/** Etapa 2 — inicia o fluxo OAuth: /clientes/[id]/integracoes/google → "Conectar Google Ads" → aqui → Google. */
export async function GET(request: NextRequest) {
  const session = await requireSession();

  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId é obrigatório." }, { status: 400 });
  }

  // Multi-tenant (etapa 6): nunca iniciar OAuth para um Client de outra Organization.
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: session.organizationId } });
  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  if (!isGoogleAdsConfigured()) {
    const url = new URL(`/clientes/${clientId}/integracoes/google`, request.url);
    url.searchParams.set("erro", `not_configured:${listMissingGoogleAdsEnvVars().join(",")}`);
    return NextResponse.redirect(url);
  }

  const state = await signOAuthState({ organizationId: session.organizationId, clientId, userId: session.userId });
  return NextResponse.redirect(buildGoogleAdsAuthUrl(state));
}
