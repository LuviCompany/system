import type { Metadata } from "next";

import { NewLeadDrawer } from "@/components/leads/new-lead-drawer";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { requireSession } from "@/server/auth/session";
import { listLeadsByStage } from "@/server/leads/lead.service";
import { listTags } from "@/server/tags/tag.service";
import { listTeamMembers } from "@/server/team/team.service";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const session = await requireSession();
  const [leadsByStage, tags, team] = await Promise.all([
    listLeadsByStage(session.organizationId, session),
    listTags(session.organizationId),
    listTeamMembers(session.organizationId),
  ]);

  const teamMembers = team.map((member) => ({ id: member.id, name: member.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Pipeline</h1>
          <p className="text-sm text-ink-500">
            Arraste os cards entre as etapas ou use o seletor no card para mover pelo teclado.
          </p>
        </div>
        <NewLeadDrawer availableTags={tags} teamMembers={teamMembers} />
      </div>

      <PipelineBoard
        leadsByStage={leadsByStage}
        availableTags={tags}
        teamMembers={teamMembers}
        currentUserId={session.userId}
      />
    </div>
  );
}
