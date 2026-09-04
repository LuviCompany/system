import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BestContentCard } from "@/components/clientes/best-content-card";
import { ContentTable } from "@/components/clientes/content-table";
import { PeriodSelector } from "@/components/clientes/period-selector";
import { TopEngagement } from "@/components/clientes/top-engagement";
import type { PeriodPreset } from "@/modules/clientes/constants";
import { requireSession } from "@/server/auth/session";
import { getClientById } from "@/server/clients/client.service";
import { resolvePeriod } from "@/server/clients/period";
import { getBestContent, getTopEngagedUsers, listSocialPosts } from "@/server/clients/social.service";

export const metadata: Metadata = { title: "Social Media do cliente" };

interface PageProps {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ periodo?: string }>;
}

export default async function ClienteSocialMediaPage({ params, searchParams }: PageProps) {
  const { clientId } = await params;
  const { periodo } = await searchParams;
  const session = await requireSession();

  const client = await getClientById(session.organizationId, clientId);
  if (!client) notFound();

  const preset = (periodo as PeriodPreset) ?? "30dias";
  const period = resolvePeriod(preset);
  const filter = { organizationId: session.organizationId, clientId, period };

  const [posts, bestContent, topUsers] = await Promise.all([
    listSocialPosts(filter),
    getBestContent(filter),
    getTopEngagedUsers(filter),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Social Media — {client.tradeName ?? client.name}</h1>
          <p className="text-sm text-ink-500">Conteúdos publicados e engajamento no período.</p>
        </div>
        <PeriodSelector value={preset} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BestContentCard post={bestContent} />
        <TopEngagement users={topUsers} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-900">Conteúdos</h2>
        <ContentTable posts={posts} />
      </div>
    </div>
  );
}
