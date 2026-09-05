import Link from "next/link";
import type { ClientPlatform, IntegrationPlatform } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { INTEGRATION_STATUS_ICON, INTEGRATION_STATUS_LABELS } from "@/modules/clientes/constants";
import { isMetaConfigured, listMissingMetaEnvVars } from "@/server/integrations/meta/config";
import { isGenuinelyConnected } from "@/server/integrations/meta/connection.service";

import { DisconnectMetaButton } from "./disconnect-meta-button";
import { SyncMetaButton } from "./sync-meta-button";

type MetaPlatform = Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">;

interface MetaIntegrationCardProps {
  clientId: string;
  platform: MetaPlatform;
  label: string;
  connection: ClientPlatform | null;
}

/**
 * Card de integração para Meta Ads / Instagram (etapa 6 — arquitetura
 * preparada, sem OAuth real). Mesma estrutura visual do card do Google Ads,
 * mas o botão "Conectar" sempre volta com "não configurado" nesta etapa —
 * nunca mostra "Conectado" para o status mock herdado do seed (item 16).
 */
export function MetaIntegrationCard({ clientId, platform, label, connection }: MetaIntegrationCardProps) {
  const configured = isMetaConfigured();
  const genuinelyConnected = isGenuinelyConnected(connection);
  const status = genuinelyConnected ? connection!.status : "NAO_CONECTADO";
  const connectScope = platform === "META_ADS" ? "ads" : "instagram";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {INTEGRATION_STATUS_ICON[status]} {label}
        </CardTitle>
        <Badge variant={status === "CONECTADO" ? "success" : status === "ERRO" ? "danger" : "neutral"}>
          {INTEGRATION_STATUS_LABELS[status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {!configured && (
          <p className="text-xs text-ink-400">
            Arquitetura preparada para OAuth real nesta etapa — ainda sem credenciais configuradas
            {listMissingMetaEnvVars().length > 0 ? ` (${listMissingMetaEnvVars().join(", ")})` : ""}.
          </p>
        )}

        {genuinelyConnected && (
          <div className="text-sm text-ink-500">
            <p>Conta: {connection?.accountLabel ?? connection?.externalAccountId}</p>
            {connection?.lastSyncAt && <p>Última sincronização: {formatDate(connection.lastSyncAt)}</p>}
          </div>
        )}
        {status === "ERRO" && connection?.lastSyncError && <p className="text-sm text-danger-600">{connection.lastSyncError}</p>}

        <div className="flex flex-wrap gap-2">
          {!genuinelyConnected ? (
            <Button variant="outline" asChild>
              <Link href={`/api/integrations/meta/connect?clientId=${clientId}&platform=${connectScope}`}>Conectar</Link>
            </Button>
          ) : (
            <>
              <SyncMetaButton clientId={clientId} platform={platform} />
              <DisconnectMetaButton clientId={clientId} platform={platform} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
