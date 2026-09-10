"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileNameAction } from "@/server/profile/actions";

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await updateProfileNameAction({ name });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      // Faz o Header (que recebe o nome via prop do server layout) buscar a
      // sessão de novo, já com o cookie reemitido pela action — mesmo padrão
      // de components/org/org-settings-form.tsx.
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="max-w-xs space-y-1.5">
        <Label htmlFor="profile-name">Nome</Label>
        <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={saving || name.trim().length === 0}>
          {saving ? "Salvando..." : "Salvar nome"}
        </Button>
        {saved && <span className="text-sm text-success-600">Nome atualizado.</span>}
      </div>
    </form>
  );
}
