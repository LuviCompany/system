import { prisma } from "@/server/db/prisma";
import type { PeriodRange } from "@/modules/clientes/types";

interface PostFilter {
  organizationId: string;
  clientId: string;
  period: PeriodRange;
}

function engagementOf(post: { likes: number; comments: number; shares: number; saves: number }): number {
  return post.likes + post.comments + post.shares + post.saves;
}

function engagementRateOf(post: { reach: number; likes: number; comments: number; shares: number; saves: number }): number {
  return post.reach > 0 ? (engagementOf(post) / post.reach) * 100 : 0;
}

export async function listSocialPosts(filter: PostFilter) {
  const posts = await prisma.socialPost.findMany({
    where: { organizationId: filter.organizationId, clientId: filter.clientId, publishedAt: { gte: filter.period.start, lte: filter.period.end } },
    orderBy: { publishedAt: "desc" },
  });

  return posts.map((post) => ({
    ...post,
    engagement: engagementOf(post),
    engagementRate: engagementRateOf(post),
  }));
}

export async function getBestContent(filter: PostFilter) {
  const posts = await listSocialPosts(filter);
  if (posts.length === 0) return null;
  return posts.reduce((best, current) => (current.engagementRate > best.engagementRate ? current : best));
}

/** Ranking de usuários mais engajados — retorna [] quando não há dado individual (nunca inventa). */
export async function getTopEngagedUsers(filter: PostFilter, limit = 10) {
  const engagements = await prisma.socialEngagement.findMany({
    where: {
      organizationId: filter.organizationId,
      post: { clientId: filter.clientId, publishedAt: { gte: filter.period.start, lte: filter.period.end } },
    },
  });

  const byUser = new Map<string, { userIdentifier: string; interactionCount: number; source: string }>();
  for (const e of engagements) {
    const current = byUser.get(e.userIdentifier);
    if (current) {
      current.interactionCount += e.interactionCount;
    } else {
      byUser.set(e.userIdentifier, { userIdentifier: e.userIdentifier, interactionCount: e.interactionCount, source: e.engagementSource });
    }
  }

  return [...byUser.values()].sort((a, b) => b.interactionCount - a.interactionCount).slice(0, limit);
}

export interface ClientSocialSummary {
  clientId: string;
  clientName: string;
  posts: number;
  reach: number;
  engagement: number;
  shares: number;
  saves: number;
  followers: number;
}

/** Visão geral de Social Media entre todos os clientes (etapa 15). `followers`
 * é um total estático de demonstração até existir sincronização real via API
 * do Instagram/Meta — nesta etapa não há série histórica de seguidores. */
export async function getSocialOverview(organizationId: string, period: PeriodRange): Promise<{
  totals: { clients: number; posts: number; reach: number; engagement: number; interactions: number; shares: number; saves: number; followers: number };
  clients: ClientSocialSummary[];
}> {
  const clients = await prisma.client.findMany({ where: { organizationId, status: "ATIVO" }, select: { id: true, name: true, tradeName: true } });

  const rows = await Promise.all(
    clients.map(async (client) => {
      const posts = await listSocialPosts({ organizationId, clientId: client.id, period });
      const reach = posts.reduce((sum, p) => sum + p.reach, 0);
      const engagement = posts.reduce((sum, p) => sum + p.engagement, 0);
      const shares = posts.reduce((sum, p) => sum + p.shares, 0);
      const saves = posts.reduce((sum, p) => sum + p.saves, 0);
      // Seguidores: dado mock estável por cliente (proporcional ao alcance médio) —
      // marcado claramente como demonstrativo, nunca usado como fonte oficial.
      const followers = Math.round(6500 + reach * 1.8);

      return {
        clientId: client.id,
        clientName: client.tradeName ?? client.name,
        posts: posts.length,
        reach,
        engagement,
        shares,
        saves,
        followers,
      } satisfies ClientSocialSummary;
    }),
  );

  const totals = rows.reduce(
    (acc, row) => ({
      clients: acc.clients,
      posts: acc.posts + row.posts,
      reach: acc.reach + row.reach,
      engagement: acc.engagement + row.engagement,
      interactions: acc.interactions + row.engagement,
      shares: acc.shares + row.shares,
      saves: acc.saves + row.saves,
      followers: acc.followers + row.followers,
    }),
    { clients: rows.length, posts: 0, reach: 0, engagement: 0, interactions: 0, shares: 0, saves: 0, followers: 0 },
  );

  return { totals, clients: rows };
}
