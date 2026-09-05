"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { syncGoogleAdsAction } from "@/server/integrations/google-ads/actions";

export function SyncGoogleAdsButton({ clientId }: { clientId: string }) {
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
            const result = await syncGoogleAdsAction(clientId);
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
