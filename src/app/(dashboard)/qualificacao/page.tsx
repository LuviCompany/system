import type { Metadata } from "next";

import { LeadsTable } from "@/components/leads/leads-table";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { requireSession } from "@/server/auth/session";
import { listLeads } from "@/server/leads/lead.service";
import { listTags } from "@/server/tags/tag.service";
import { listTeamMembers } from "@/server/team/team.service";

export const metadata: Metadata = { title: "Qualificação" };

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-ink-500">{label}</p>
        <p className="mt-1 font-mono text-xl font-semibold text-ink-900">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function QualificacaoPage() {
  const session = await requireSession();
  const [leads, tags, team] = await Promise.all([
    listLeads(session.organizationId, session),
    listTags(session.organizationId),
    listTeamMembers(session.organizationId),
  ]);

  const teamMembers = team.map((member) => ({ id: member.id, name: member.name }));

  const alta = leads.filter((l) => l.priority === "ALTA" || l.priority === "MAXIMA").length;
  const media = leads.filter((l) => l.priority === "MEDIA").length;
  const baixa = leads.filter((l) => l.priority === "BAIXA").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Qualificação</h1>
        <p className="text-sm text-ink-500">
          Todos os leads analisados pelo ICP Score, do mais ao menos prioritário. Comece pelo topo da lista.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBox label="Total analisados" value={formatNumber(leads.length)} />
        <StatBox label="Alta prioridade" value={formatNumber(alta)} />
        <StatBox label="Média prioridade" value={formatNumber(media)} />
        <StatBox label="Baixa prioridade" value={formatNumber(baixa)} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Leads que merecem contato primeiro</h2>
        <LeadsTable
          leads={leads}
          teamMembers={teamMembers}
          availableTags={tags}
          currentUserId={session.userId}
          defaultSort="score"
        />
      </div>
    </div>
  );
}
