import type { Metadata } from "next";

import { AvatarUpload } from "@/components/perfil/avatar-upload";
import { ProfileNameForm } from "@/components/perfil/profile-name-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/modules/team/roles";
import { requireSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const session = await requireSession();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Meu perfil</h1>
        <p className="text-sm text-ink-500">Seus dados pessoais no LUVI SYSTEM.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload name={session.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileNameForm initialName={session.name} />

          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-ink-500">E-mail</p>
              <p className="text-sm text-ink-900">{session.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-ink-500">Cargo</p>
              <p className="text-sm text-ink-900">{ROLE_LABELS[session.role]}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
