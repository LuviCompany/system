"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { disconnectGoogleAdsAction } from "@/server/integrations/google-ads/actions";

export function DisconnectGoogleAdsButton({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          if (!confirm("Desconectar o Google Ads deste cliente? O histórico de métricas já sincronizado será mantido.")) return;
          await disconnectGoogleAdsAction(clientId);
          router.refresh();
        })
      }
    >
      {isPending ? "Desconectando..." : "Desconectar"}
    </Button>
  );
}
