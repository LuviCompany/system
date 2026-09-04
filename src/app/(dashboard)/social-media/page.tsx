import { Heart, Image as ImageIcon, MessageSquare, Share2, Users, Bookmark } from "lucide-react";
import type { Metadata } from "next";

import { PeriodSelector } from "@/components/clientes/period-selector";
import { SocialClientsTable } from "@/components/clientes/social-clients-table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import type { PeriodPreset } from "@/modules/clientes/constants";
import { requireSession } from "@/server/auth/session";
import { resolvePeriod } from "@/server/clients/period";
import { getSocialOverview } from "@/server/clients/social.service";

export const metadata: Metadata = { title: "Social Media" };

interface PageProps {
  searchParams: Promise<{ periodo?: string }>;
}

export default async function SocialMediaPage({ searchParams }: PageProps) {
  const { periodo } = await searchParams;
  const session = await requireSession();
  const preset = (periodo as PeriodPreset) ?? "30dias";
  const period = resolvePeriod(preset);

  const { totals, clients } = await getSocialOverview(session.organizationId, period);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-ink-900">Social Media</h1>
            <Badge variant="brand">Dados MOCK</Badge>
          </div>
          <p className="text-sm text-ink-500">Performance de conteúdo e engajamento das contas geridas pela Luvi.</p>
        </div>
        <PeriodSelector value={preset} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Clientes" value={formatNumber(totals.clients)} icon={Users} accent />
        <MetricCard label="Posts" value={formatNumber(totals.posts)} icon={ImageIcon} />
        <MetricCard label="Alcance" value={formatNumber(totals.reach)} icon={Users} />
        <MetricCard label="Engajamento" value={formatNumber(totals.engagement)} icon={Heart} />
        <MetricCard label="Compartilhamentos" value={formatNumber(totals.shares)} icon={Share2} />
        <MetricCard label="Salvamentos" value={formatNumber(totals.saves)} icon={Bookmark} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-ink-500" aria-hidden />
          <h2 className="text-sm font-semibold text-ink-900">Contas gerenciadas</h2>
        </div>
        <SocialClientsTable clients={clients} />
        <p className="text-xs text-ink-400">Clique em um cliente para ver os conteúdos, o melhor post e o ranking de engajamento.</p>
      </div>
    </div>
  );
}
