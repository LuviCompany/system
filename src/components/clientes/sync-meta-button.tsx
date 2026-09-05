"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { IntegrationPlatform } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { syncMetaAction } from "@/server/integrations/meta/actions";

type MetaPlatform = Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">;

export function SyncMetaButton({ clientId, platform }: { clientId: string; platform: MetaPlatform }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-1.5">
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await syncMetaAction(clientId, platform);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
      >
        <RefreshCw className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
        {isPending ? "Sincronizando..." : "Sincronizar agora"}
      </Button>
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
