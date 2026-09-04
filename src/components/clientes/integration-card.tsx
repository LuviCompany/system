"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { toggleClientPlatformAction } from "@/server/clients/actions";
import type { IntegrationPlatform, IntegrationStatus } from "@prisma/client";

interface IntegrationCardProps {
  clientId: string;
  platform: IntegrationPlatform;
  label: string;
  status: IntegrationStatus;
  accountLabel: string | null;
  connectedAt: Date | null;
}

export function IntegrationCard({ clientId, platform, label, status, accountLabel, connectedAt }: IntegrationCardProps) {
  const [isPending, startTransition] = useTransition();
  const connected = status === "CONECTADO";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <Badge variant={connected ? "success" : "neutral"}>{connected ? "Conectado" : "Não conectado"}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {connected ? (
          <div className="text-sm text-ink-500">
            {accountLabel && <p>{accountLabel}</p>}
            {connectedAt && <p>Conectado em {formatDate(connectedAt)}</p>}
          </div>
        ) : (
          <p className="text-sm text-ink-500">Nenhuma conta conectada nesta etapa. A autorização real (OAuth) será implementada em uma próxima etapa.</p>
        )}
        <Button
          variant={connected ? "outline" : "primary"}
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await toggleClientPlatformAction(clientId, platform);
            })
          }
        >
          {isPending ? "Atualizando..." : connected ? "Desconectar" : "Conectar"}
        </Button>
      </CardContent>
    </Card>
  );
}
