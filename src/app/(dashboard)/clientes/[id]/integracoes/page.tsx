import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { IntegrationCard } from "@/components/clientes/integration-card";
import { INTEGRATION_PLATFORM_LABELS } from "@/modules/clientes/constants";
import { requireSession } from "@/server/auth/session";
import { getClientById } from "@/server/clients/client.service";

export const metadata: Metadata = { title: "Integrações do cliente" };

const PLATFORMS = ["META_ADS", "GOOGLE_ADS", "INSTAGRAM", "GOOGLE_ANALYTICS"] as const;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClienteIntegracoesPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();
  const client = await getClientById(session.organizationId, id);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Integrações — {client.tradeName ?? client.name}</h1>
        <p className="text-sm text-ink-500">
          Status de conexão com cada plataforma. Nesta etapa não há autorização (OAuth) real — a interface já está pronta para
          receber a conexão de fato em uma próxima etapa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLATFORMS.map((platform) => {
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
