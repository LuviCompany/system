import type { Metadata } from "next";

import { FollowUpList } from "@/components/followups/follow-up-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireSession } from "@/server/auth/session";
import { listFollowUps } from "@/server/followups/followup.service";

export const metadata: Metadata = { title: "Follow-ups" };

export default async function FollowUpsPage() {
  const session = await requireSession();
  const followUps = await listFollowUps(session.organizationId, session);

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const pending = followUps.filter((item) => item.status === "PENDENTE");
  const overdue = pending.filter((item) => item.scheduledAt < startOfToday);
  const today = pending.filter((item) => item.scheduledAt >= startOfToday && item.scheduledAt <= endOfToday);
  const upcoming = pending.filter((item) => item.scheduledAt > endOfToday);
  const done = followUps.filter((item) => item.status === "CONCLUIDO");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Follow-ups</h1>
        <p className="text-sm text-ink-500">Compromissos agendados com os leads em prospecção.</p>
      </div>

      <Tabs defaultValue="hoje">
        <TabsList>
          <TabsTrigger value="hoje">Hoje ({today.length})</TabsTrigger>
          <TabsTrigger value="atrasados">Atrasados ({overdue.length})</TabsTrigger>
          <TabsTrigger value="proximos">Próximos ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos ({done.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="hoje">
          <FollowUpList items={today} emptyMessage="Nenhum follow-up para hoje." />
        </TabsContent>
        <TabsContent value="atrasados">
          <FollowUpList items={overdue} emptyMessage="Nenhum follow-up atrasado." />
        </TabsContent>
        <TabsContent value="proximos">
          <FollowUpList items={upcoming} emptyMessage="Nenhum follow-up futuro agendado." />
        </TabsContent>
        <TabsContent value="concluidos">
          <FollowUpList items={done} emptyMessage="Nenhum follow-up concluído ainda." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
