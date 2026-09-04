"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { completeFollowUpAction } from "@/server/followups/actions";

export interface FollowUpItem {
  id: string;
  scheduledAt: Date | string;
  note: string | null;
  status: "PENDENTE" | "CONCLUIDO";
  lead: { id: string; company: string };
  responsavel: { id: string; name: string };
}

function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(
    date,
  );
}

export function FollowUpList({ items, emptyMessage }: { items: FollowUpItem[]; emptyMessage: string }) {
  const router = useRouter();
  const [completingId, setCompletingId] = useState<string | null>(null);

  async function handleComplete(id: string) {
    setCompletingId(id);
    try {
      await completeFollowUpAction(id);
      router.refresh();
    } finally {
      setCompletingId(null);
    }
  }

  if (items.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card key={item.id} className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-medium text-ink-900">{item.lead.company}</p>
            <p className="text-sm text-ink-500">{item.note ?? "Sem observações"}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-ink-400">
              <span>{formatDateTime(item.scheduledAt)}</span>
              <span>·</span>
              <span>{item.responsavel.name}</span>
              {item.status === "CONCLUIDO" && <Badge variant="success">Concluído</Badge>}
            </div>
          </div>
          {item.status === "PENDENTE" && (
            <Button
              size="sm"
              variant="outline"
              disabled={completingId === item.id}
              onClick={() => handleComplete(item.id)}
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              Concluir
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
