import type { Metadata } from "next";

import { ClientsTable } from "@/components/clientes/clients-table";
import { NewClientDrawer } from "@/components/clientes/new-client-drawer";
import { requireSession } from "@/server/auth/session";
import { listClientsWithMetrics } from "@/server/clients/client.service";
import { listTeamMembers } from "@/server/team/team.service";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesListaPage() {
  const session = await requireSession();
  const [clients, teamMembers] = await Promise.all([
    listClientsWithMetrics(session.organizationId),
    listTeamMembers(session.organizationId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Clientes</h1>
          <p className="text-sm text-ink-500">Cadastre e gerencie as contas atendidas pela Luvi Company.</p>
        </div>
        <NewClientDrawer teamMembers={teamMembers.map((m) => ({ id: m.id, name: m.name }))} />
      </div>

      <ClientsTable clients={clients} />
    </div>
  );
}
