import type { Metadata } from "next";

import { IcpProfileSwitcher } from "@/components/icp/icp-profile-switcher";
import { requireSession } from "@/server/auth/session";
import { listIcpProfiles } from "@/server/icp/icp.service";

export const metadata: Metadata = { title: "ICP" };

export default async function IcpPage() {
  const session = await requireSession();
  const profiles = await listIcpProfiles(session.organizationId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Perfil de Cliente Ideal</h1>
        <p className="text-sm text-ink-500">Defina o tipo de empresa que a Luvi deve priorizar.</p>
      </div>

      <IcpProfileSwitcher profiles={profiles} />
    </div>
  );
}
