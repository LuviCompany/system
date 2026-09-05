import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentSession } from "@/server/auth/session";
import { saveInitialTokens } from "@/server/integrations/google-ads/connection.service";
import { toGoogleAdsError } from "@/server/integrations/google-ads/errors";
import { exchangeCodeForTokens } from "@/server/integrations/google-ads/oauth";
import { verifyOAuthState } from "@/server/integrations/google-ads/state";

/** Etapa 2 — callback OAuth do Google: troca o `code` por tokens e salva a conexão (ainda sem conta escolhida). */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  const state = stateParam ? await verifyOAuthState(stateParam) : null;
  const fallbackClientPath = state ? `/clientes/${state.clientId}/integracoes/google` : "/clientes";

  if (errorParam) {
    // Usuário cancelou o consentimento na tela do Google — não é um erro de sistema.
    const url = new URL(fallbackClientPath, request.url);
    url.searchParams.set("erro", "cancelado");
    return NextResponse.redirect(url);
  }

  if (!code || !state) {
    const url = new URL(fallbackClientPath, request.url);
    url.searchParams.set("erro", "state_invalido");
    return NextResponse.redirect(url);
  }

  // Defesa extra: a sessão do navegador que volta do Google precisa ser a
  // mesma organização que iniciou o fluxo (o `state` assinado já garante
  // isso, esta é uma segunda camada).
  const session = await getCurrentSession();
  if (!session || session.organizationId !== state.organizationId) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveInitialTokens(state.organizationId, state.clientId, tokens);
  } catch (error) {
    const mapped = toGoogleAdsError(error);
    const url = new URL(fallbackClientPath, request.url);
    url.searchParams.set("erro", mapped.code);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(`/clientes/${state.clientId}/integracoes/google/selecionar-conta`, request.url));
}
