"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { markReportReadyAction } from "@/server/clients/report.actions";

export function MarkReportReadyButton({ reportId, isReady }: { reportId: string; isReady: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (isReady) return null;

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markReportReadyAction(reportId);
          router.refresh();
        })
      }
    >
      {isPending ? "Marcando..." : "Marcar como pronto"}
    </Button>
  );
}
