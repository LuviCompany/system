import type { Metadata } from "next";

import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { requireSession } from "@/server/auth/session";
import { listRecentActivities } from "@/server/activities/activity.service";

export const metadata: Metadata = { title: "Atividades" };

export default async function AtividadesPage() {
  const session = await requireSession();
  const activities = await listRecentActivities(session.organizationId, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Atividades</h1>
        <p className="text-sm text-ink-500">Histórico de interações registradas em todos os leads.</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <ActivityTimeline activities={activities} />
      </div>
    </div>
  );
}
