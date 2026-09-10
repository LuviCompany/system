import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { GooglePlacesStatusCard } from "@/components/integrations/google-places-status-card";
import { requireSession } from "@/server/auth/session";
import { isGooglePlacesConfigured } from "@/server/lead-sourcing/google-places/config";

export const metadata: Metadata = { title: "Integrações" };

export default async function IntegracoesPage() {
  await requireSession();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/configuracoes" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Configurações
        </Link>
        <h1 className="text-xl font-semibold text-ink-900">Integrações</h1>
        <p className="text-sm text-ink-500">Fontes externas conectadas ao LUVI SYSTEM.</p>
      </div>

      <div className="max-w-lg">
        <GooglePlacesStatusCard configured={isGooglePlacesConfigured()} />
      </div>
    </div>
  );
}
