import type { Metadata } from "next";

import { CreateTeamMemberModal } from "@/components/team/create-team-member-modal";
import { TeamTable } from "@/components/team/team-table";
import { requireRole } from "@/server/auth/session";
import { listTeamMembers } from "@/server/team/team.service";

export const metadata: Metadata = { title: "Equipe" };

export default async function EquipePage() {
  const session = await requireRole(["ADMIN", "GESTOR"]);
  const members = await listTeamMembers(session.organizationId);
  const isAdmin = session.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Equipe</h1>
          <p className="text-sm text-ink-500">
            {isAdmin
              ? "Gerencie os usuários do seu workspace e seus níveis de acesso."
              : "Usuários com acesso ao workspace da Luvi Company."}
          </p>
        </div>
        {isAdmin && <CreateTeamMemberModal />}
      </div>

      <TeamTable members={members} canManage={isAdmin} />
    </div>
  );
}
