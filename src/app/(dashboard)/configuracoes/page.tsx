import { ChevronRight, Plug } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgSettingsForm } from "@/components/org/org-settings-form";
import { AppearanceSettings } from "@/components/theme/appearance-settings";
import { requireSession } from "@/server/auth/session";
import { getOrganization } from "@/server/org/org.service";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const session = await requireSession();
  const organization = await getOrganization(session.organizationId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Configurações</h1>
        <p className="text-sm text-ink-500">Dados da sua organização no LUVI CRM.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
        </CardHeader>
        <OrgSettingsForm
          initialName={organization.name}
          initialDomain={organization.domain ?? ""}
          canEdit={session.role === "ADMIN"}
        />
      </Card>

      {session.role !== "ADMIN" && (
        <p className="text-xs text-ink-400">Apenas administradores podem editar os dados da organização.</p>
      )}

      <AppearanceSettings />

      <Link href="/configuracoes/integracoes">
        <Card className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-surface-subtle">
          <div className="flex items-center gap-3">
            <Plug className="h-5 w-5 text-ink-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink-900">Integrações</p>
              <p className="text-sm text-ink-500">Fontes externas de leads, como o Google Places.</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-400" aria-hidden />
        </Card>
      </Link>
    </div>
  );
}
