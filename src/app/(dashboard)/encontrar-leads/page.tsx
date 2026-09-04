import type { Metadata } from "next";

import { EncontrarLeadsWorkspace } from "@/components/lead-sourcing/encontrar-leads-workspace";
import { requireSession } from "@/server/auth/session";
import { listIcpProfiles } from "@/server/icp/icp.service";
import { isGooglePlacesConfigured } from "@/server/lead-sourcing/google-places/config";

export const metadata: Metadata = { title: "Encontrar Leads" };

export default async function EncontrarLeadsPage() {
  const session = await requireSession();
  const icpProfiles = await listIcpProfiles(session.organizationId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Encontrar Leads</h1>
        <p className="text-sm text-ink-500">Encontre empresas com potencial para a Luvi e priorize quem mais se encaixa no seu ICP.</p>
      </div>

      <EncontrarLeadsWorkspace icpProfiles={icpProfiles} googleConfigured={isGooglePlacesConfigured()} />
    </div>
  );
}
