"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { IntegrationPlatform } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { disconnectMetaAction } from "@/server/integrations/meta/actions";

type MetaPlatform = Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">;

export function DisconnectMetaButton({ clientId, platform }: { clientId: string; platform: MetaPlatform }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          if (!confirm("Desconectar esta integração? O histórico de métricas já sincronizado será mantido.")) return;
          await disconnectMetaAction(clientId, platform);
          router.refresh();
        })
      }
    >
      {isPending ? "Desconectando..." : "Desconectar"}
    </Button>
  );
}
