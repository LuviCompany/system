import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GoogleAdsIntegrationCard } from "@/components/clientes/google-ads-integration-card";
import { requireSession } from "@/server/auth/session";
import { getClientById } from "@/server/clients/client.service";
import { getGoogleAdsConnection } from "@/server/integrations/google-ads/connection.service";

export const metadata: Metadata = { title: "Google Ads — Integração" };

const ERROR_MESSAGES: Record<string, string> = {
  cancelado: "Você cancelou a autorização no Google.",
  state_invalido: "A sessão de autorização expirou. Tente conectar novamente.",
  UNAUTHORIZED: "Não foi possível autenticar com o Google Ads.",
  INVALID_GRANT: "A autorização expirou ou foi revogada. Tente conectar novamente.",
  SERVER_ERROR: "O Google está indisponível no momento. Tente novamente.",
  TIMEOUT: "Tempo esgotado ao falar com o Google. Tente novamente.",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}

export default async function GoogleAdsIntegrationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { erro } = await searchParams;
  const session = await requireSession();

  const client = await getClientById(session.organizationId, id);
  if (!client) notFound();

  const connection = await getGoogleAdsConnection(session.organizationId, id);

  const isMissingConfigError = erro?.startsWith("not_configured:");
  const missingVars = isMissingConfigError ? erro!.replace("not_configured:", "").split(",") : [];
  const errorMessage = erro ? (isMissingConfigError ? null : ERROR_MESSAGES[erro] ?? "Não foi possível concluir a conexão com o Google Ads.") : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Google Ads — {client.tradeName ?? client.name}</h1>
        <p className="text-sm text-ink-500">Conexão real via OAuth 2.0, somente leitura.</p>
      </div>

      {isMissingConfigError && (
        <div className="rounded-md border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-600">
          Faltam as seguintes variáveis de ambiente para habilitar esta integração: <strong>{missingVars.join(", ")}</strong>. Ver{" "}
          <code>docs/google-ads.md</code>.
        </div>
      )}
      {errorMessage && (
        <div className="rounded-md border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-600">{errorMessage}</div>
      )}

      <GoogleAdsIntegrationCard clientId={client.id} connection={connection} />
    </div>
  );
}
