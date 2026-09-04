import type { Metadata } from "next";

import { LeadsTable } from "@/components/leads/leads-table";
import { NewLeadDrawer } from "@/components/leads/new-lead-drawer";
import { requireSession } from "@/server/auth/session";
import { listLeads } from "@/server/leads/lead.service";
import { listTags } from "@/server/tags/tag.service";
import { listTeamMembers } from "@/server/team/team.service";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage() {
  const session = await requireSession();
  const [leads, tags, team] = await Promise.all([
    listLeads(session.organizationId, session),
    listTags(session.organizationId),
    listTeamMembers(session.organizationId),
  ]);

  const teamMembers = team.map((member) => ({ id: member.id, name: member.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Leads</h1>
          <p className="text-sm text-ink-500">Todas as empresas prospectadas pelo time comercial.</p>
        </div>
        <NewLeadDrawer availableTags={tags} teamMembers={teamMembers} />
      </div>

      <LeadsTable leads={leads} teamMembers={teamMembers} availableTags={tags} currentUserId={session.userId} />
    </div>
  );
}
