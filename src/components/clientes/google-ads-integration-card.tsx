import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { INTEGRATION_STATUS_ICON, INTEGRATION_STATUS_LABELS } from "@/modules/clientes/constants";
import { isGoogleAdsConfigured, listMissingGoogleAdsEnvVars } from "@/server/integrations/google-ads/config";
import type { ClientPlatform } from "@prisma/client";

import { DisconnectGoogleAdsButton } from "./disconnect-google-ads-button";
import { SyncGoogleAdsButton } from "./sync-google-ads-button";

interface GoogleAdsIntegrationCardProps {
  clientId: string;
  connection: ClientPlatform | null;
}

/** Card real (não mock) de Google Ads na página de integrações do cliente — etapa 5. */
export function GoogleAdsIntegrationCard({ clientId, connection }: GoogleAdsIntegrationCardProps) {
  const configured = isGoogleAdsConfigured();
  const status = connection?.status ?? "NAO_CONECTADO";
  const connected = status === "CONECTADO";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {INTEGRATION_STATUS_ICON[status]} Google Ads
        </CardTitle>
        <Badge variant={connected ? "success" : status === "ERRO" ? "danger" : "neutral"}>
          {INTEGRATION_STATUS_LABELS[status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {!configured ? (
          <p className="text-sm text-danger-600">
            Integração ainda não configurada nesta instalação — faltam variáveis de ambiente
            ({listMissingGoogleAdsEnvVars().join(", ")}). Ver <code>docs/google-ads.md</code>.
          </p>
        ) : (
          <>
            {connected && (
              <div className="text-sm text-ink-500">
                <p>Conta: {connection?.accountLabel ?? connection?.externalAccountId}</p>
                {connection?.lastSyncAt && <p>Última sincronização: {formatDate(connection.lastSyncAt)}</p>}
              </div>
            )}
            {status === "ERRO" && connection?.lastSyncError && (
              <p className="text-sm text-danger-600">{connection.lastSyncError}</p>
            )}
            {!connected && (
              <p className="text-sm text-ink-500">
                Conecte a conta Google Ads deste cliente para ver campanhas e métricas reais no dashboard.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {!connected ? (
                <Button asChild>
                  <Link href={`/api/integrations/google-ads/connect?clientId=${clientId}`}>Conectar Google Ads</Link>
                </Button>
              ) : (
                <>
                  <SyncGoogleAdsButton clientId={clientId} />
                  <Button variant="outline" asChild>
                    <Link href={`/clientes/${clientId}/google-ads`}>Ver dashboard</Link>
                  </Button>
                  <DisconnectGoogleAdsButton clientId={clientId} />
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
