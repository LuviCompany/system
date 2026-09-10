import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentSession } from "@/server/auth/session";
import { saveInitialTokens } from "@/server/integrations/meta/connection.service";
import { toMetaError } from "@/server/integrations/meta/errors";
import { exchangeCodeForTokens } from "@/server/integrations/meta/oauth";
import { verifyMetaOAuthState } from "@/server/integrations/meta/state";

/**
 * Callback OAuth da Meta — etapa 7: troca o `code` por tokens reais
 * (somente para scope "ads"; scope "instagram" nunca chega aqui, pois o
 * connect route bloqueia antes de gerar um `state` válido) e redireciona
 * para a seleção de conta de anúncios.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  const state = stateParam ? await verifyMetaOAuthState(stateParam) : null;
  const fallbackPath = state ? `/clientes/${state.clientId}/integracoes` : "/clientes";

  if (errorParam) {
    const url = new URL(fallbackPath, request.url);
    url.searchParams.set("erro", "meta_cancelado");
    return NextResponse.redirect(url);
  }

  if (!code || !state) {
    const url = new URL(fallbackPath, request.url);
    url.searchParams.set("erro", "meta_state_invalido");
    return NextResponse.redirect(url);
  }

  const session = await getCurrentSession();
  if (!session || session.organizationId !== state.organizationId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveInitialTokens(state.organizationId, state.clientId, state.scope === "ads" ? "META_ADS" : "INSTAGRAM", tokens);
  } catch (error) {
    const mapped = toMetaError(error);
    const url = new URL(fallbackPath, request.url);
    url.searchParams.set("erro", mapped.code);
    return NextResponse.redirect(url);
  }

  if (state.scope === "ads") {
    return NextResponse.redirect(new URL(`/clientes/${state.clientId}/integracoes/meta/selecionar-conta`, request.url));
  }
  return NextResponse.redirect(new URL(fallbackPath, request.url));
}
