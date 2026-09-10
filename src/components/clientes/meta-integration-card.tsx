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
 * Card de integração para Meta Ads / Instagram. Meta Ads é uma conexão real
 * (etapa 7, somente ads_read). Instagram continua com a arquitetura pronta
 * mas explicitamente não implementado — nunca mostra "Conectado" para o
 * status mock herdado do seed, e não depende de isMetaConfigured() (que a
 * partir de agora reflete só as credenciais de Meta Ads).
 */
export function MetaIntegrationCard({ clientId, platform, label, connection }: MetaIntegrationCardProps) {
  const isInstagram = platform === "INSTAGRAM";
  const configured = isMetaConfigured();
  const genuinelyConnected = isGenuinelyConnected(connection);
  const status = genuinelyConnected ? connection!.status : "NAO_CONECTADO";

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
        {isInstagram ? (
          <p className="text-xs text-ink-400">Arquitetura pronta — implementação prevista para uma próxima etapa.</p>
        ) : (
          !configured && (
            <p className="text-sm text-danger-600">
              Integração ainda não configurada nesta instalação — faltam variáveis de ambiente
              {listMissingMetaEnvVars().length > 0 ? ` (${listMissingMetaEnvVars().join(", ")})` : ""}. Ver <code>docs/meta-ads.md</code>.
            </p>
          )
        )}

        {genuinelyConnected && (
          <div className="text-sm text-ink-500">
            <p>Conta: {connection?.accountLabel ?? connection?.externalAccountId}</p>
            {connection?.lastSyncAt && <p>Última sincronização: {formatDate(connection.lastSyncAt)}</p>}
          </div>
        )}
        {status === "ERRO" && connection?.lastSyncError && <p className="text-sm text-danger-600">{connection.lastSyncError}</p>}

        {!isInstagram && (
          <div className="flex flex-wrap gap-2">
            {!genuinelyConnected ? (
              configured && (
                <Button variant="outline" asChild>
                  <Link href={`/api/integrations/meta/connect?clientId=${clientId}&platform=ads`}>Conectar Meta Ads</Link>
                </Button>
              )
            ) : (
              <>
                <SyncMetaButton clientId={clientId} platform={platform} />
                <Button variant="outline" asChild>
                  <Link href={`/clientes/${clientId}/meta-ads`}>Ver dashboard</Link>
                </Button>
                <DisconnectMetaButton clientId={clientId} platform={platform} />
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
