"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { IcpProfileEditor } from "@/components/icp/icp-profile-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IcpProfileForClient } from "@/server/icp/icp.service";

export function IcpProfileSwitcher({ profiles }: { profiles: IcpProfileForClient[] }) {
  const defaultProfile = profiles.find((p) => p.isActive) ?? profiles[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | "new" | null>(defaultProfile?.id ?? "new");

  const selectedProfile = selectedId === "new" ? null : profiles.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      {profiles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setSelectedId(profile.id)}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                selectedId === profile.id
                  ? "border-brand-500 bg-brand-50 text-brand-500"
                  : "border-border bg-surface text-ink-600 hover:bg-surface-subtle",
              )}
            >
              {profile.name}
              {profile.isActive && (
                <Badge variant="brand" className="px-1.5 py-0 text-[10px]">
                  ativo
                </Badge>
              )}
            </button>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId("new")}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Novo perfil
          </Button>
        </div>
      )}

      <IcpProfileEditor key={selectedId ?? "new"} profile={selectedProfile} onCreated={setSelectedId} />
    </div>
  );
}
