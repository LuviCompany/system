"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrganizationAction } from "@/server/org/actions";

interface OrgSettingsFormProps {
  initialName: string;
  initialDomain: string;
  canEdit: boolean;
}

export function OrgSettingsForm({ initialName, initialDomain, canEdit }: OrgSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [domain, setDomain] = useState(initialDomain);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await updateOrganizationAction({ name, domain });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="org-name">Nome da organização</Label>
          <Input id="org-name" value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-domain">Domínio</Label>
          <Input id="org-domain" value={domain} disabled={!canEdit} onChange={(e) => setDomain(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-platform">Plataforma</Label>
          <Input id="org-platform" value="LUVI CRM" disabled />
        </div>
      </div>

      {error && (
        <p role="alert" className="mx-5 mb-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {error}
        </p>
      )}

      {canEdit && (
        <CardFooter className="justify-between">
          {saved ? <span className="text-sm text-success-600">Alterações salvas.</span> : <span />}
          <Button type="submit" variant="outline" disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardFooter>
      )}
    </form>
  );
}
