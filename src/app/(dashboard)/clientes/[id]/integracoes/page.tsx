import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GoogleAdsIntegrationCard } from "@/components/clientes/google-ads-integration-card";
import { IntegrationCard } from "@/components/clientes/integration-card";
import { MetaIntegrationCard } from "@/components/clientes/meta-integration-card";
import { INTEGRATION_PLATFORM_LABELS } from "@/modules/clientes/constants";
import { requireSession } from "@/server/auth/session";
import { getClientById } from "@/server/clients/client.service";
import { getGoogleAdsConnection } from "@/server/integrations/google-ads/connection.service";
import { getMetaConnection } from "@/server/integrations/meta/connection.service";

export const metadata: Metadata = { title: "Integrações do cliente" };

const MOCK_PLATFORMS = ["GOOGLE_ANALYTICS"] as const;

const ERROR_MESSAGES: Record<string, string> = {
  meta_cancelado: "Você cancelou a autorização na Meta.",
  meta_state_invalido: "A sessão de autorização expirou. Tente conectar novamente.",
  meta_instagram_nao_implementado: "A integração com o Instagram ainda não foi implementada nesta etapa.",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}

export default async function ClienteIntegracoesPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { erro } = await searchParams;
  const session = await requireSession();
  const client = await getClientById(session.organizationId, id);
  if (!client) notFound();

  const [googleAdsConnection, metaAdsConnection, instagramConnection] = await Promise.all([
    getGoogleAdsConnection(session.organizationId, id),
    getMetaConnection(session.organizationId, id, "META_ADS"),
    getMetaConnection(session.organizationId, id, "INSTAGRAM"),
  ]);

  const isMissingMetaConfigError = erro?.startsWith("meta_not_configured:");
  const missingMetaVars = isMissingMetaConfigError ? erro!.replace("meta_not_configured:", "").split(",") : [];
  const errorMessage = erro && !isMissingMetaConfigError ? (ERROR_MESSAGES[erro] ?? null) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Integrações — {client.tradeName ?? client.name}</h1>
        <p className="text-sm text-ink-500">
          Google Ads e Meta Ads já são conexões reais via OAuth (somente leitura). Instagram tem a arquitetura pronta, mas sua
          implementação fica para uma próxima etapa. Google Analytics segue apenas visual.
        </p>
      </div>

      {isMissingMetaConfigError && (
        <div className="rounded-md border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-600">
          Integração com a Meta ainda não configurada nesta instalação (variáveis: {missingMetaVars.join(", ")}).
        </div>
      )}
      {errorMessage && (
        <div className="rounded-md border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-600">{errorMessage}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GoogleAdsIntegrationCard clientId={client.id} connection={googleAdsConnection} />
        <MetaIntegrationCard clientId={client.id} platform="META_ADS" label="Meta Ads" connection={metaAdsConnection} />
        <MetaIntegrationCard clientId={client.id} platform="INSTAGRAM" label="Instagram" connection={instagramConnection} />
        {MOCK_PLATFORMS.map((platform) => {
          const connection = client.platforms.find((p) => p.platform === platform);
          return (
            <IntegrationCard
              key={platform}
              clientId={client.id}
              platform={platform}
              label={INTEGRATION_PLATFORM_LABELS[platform]}
              status={connection?.status ?? "NAO_CONECTADO"}
              accountLabel={connection?.accountLabel ?? null}
              connectedAt={connection?.connectedAt ?? null}
            />
          );
        })}
      </div>
    </div>
  );
}
