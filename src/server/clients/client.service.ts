import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

import type { ClientFilters, ClientInput } from "./client.schema";
import { deriveMetrics, sumTotals } from "@/modules/clientes/metrics";
import { resolvePeriod } from "./period";

const clientInclude = {
  responsavel: { select: { id: true, name: true } },
  platforms: true,
} satisfies Prisma.ClientInclude;

export type ClientRecord = Prisma.ClientGetPayload<{ include: typeof clientInclude }>;

function buildWhere(organizationId: string, filters: ClientFilters = {}): Prisma.ClientWhereInput {
  const where: Prisma.ClientWhereInput = { organizationId };

  if (filters.status) where.status = filters.status;
  if (filters.health) where.health = filters.health;
  if (filters.segment) where.segment = filters.segment;
  if (filters.platform) {
    where.platforms = { some: { platform: filters.platform, status: "CONECTADO" } };
  }
  if (filters.search) {
    const search = filters.search.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { tradeName: { contains: search, mode: "insensitive" } },
        { cnpj: { contains: search, mode: "insensitive" } },
        { segment: { contains: search, mode: "insensitive" } },
      ];
    }
  }

  return where;
}

export async function listClients(organizationId: string, filters: ClientFilters = {}): Promise<ClientRecord[]> {
  return prisma.client.findMany({
    where: buildWhere(organizationId, filters),
    include: clientInclude,
    orderBy: { name: "asc" },
  });
}

export async function getClientById(organizationId: string, clientId: string): Promise<ClientRecord | null> {
  return prisma.client.findFirst({ where: { organizationId, id: clientId }, include: clientInclude });
}

export async function createClient(organizationId: string, input: ClientInput) {
  return prisma.client.create({
    data: {
      organizationId,
      ...input,
    },
  });
}

export async function updateClient(organizationId: string, clientId: string, input: ClientInput) {
  const existing = await prisma.client.findFirst({ where: { organizationId, id: clientId } });
  if (!existing) {
    throw new Error("Cliente não encontrado.");
  }
  return prisma.client.update({ where: { id: clientId }, data: input });
}

/** Métricas do período (30 dias) usadas para a tabela e o card de saúde de cada cliente. */
export interface ClientRowMetrics {
  investment: number;
  revenue: number;
  roas: number;
  leads: number;
  sales: number;
  metaConnected: boolean;
  googleConnected: boolean;
  updatedAt: Date;
}

export async function listClientsWithMetrics(
  organizationId: string,
  filters: ClientFilters = {},
): Promise<(ClientRecord & { metrics: ClientRowMetrics })[]> {
  const clients = await listClients(organizationId, filters);
  const { start, end } = resolvePeriod("30dias");

  const results = await Promise.all(
    clients.map(async (client) => {
      const rows = await prisma.performanceMetric.findMany({
        where: { organizationId, clientId: client.id, date: { gte: start, lte: end } },
        select: { investment: true, reach: true, impressions: true, clicks: true, leads: true, sales: true, revenue: true },
      });
      const totals = sumTotals(
        rows.map((r) => ({
          investment: Number(r.investment),
          reach: r.reach,
          impressions: r.impressions,
          clicks: r.clicks,
          leads: r.leads,
          sales: r.sales,
          revenue: Number(r.revenue),
        })),
      );
      const derived = deriveMetrics(totals);
      const metaConnected = client.platforms.some((p) => p.platform === "META_ADS" && p.status === "CONECTADO");
      const googleConnected = client.platforms.some((p) => p.platform === "GOOGLE_ADS" && p.status === "CONECTADO");

      return {
        ...client,
        metrics: {
          investment: derived.investment,
          revenue: derived.revenue,
          roas: derived.roas,
          leads: derived.leads,
          sales: derived.sales,
          metaConnected,
          googleConnected,
          updatedAt: client.updatedAt,
        },
      };
    }),
  );

  return results;
}

export interface ClientsOverviewSummary {
  activeClients: number;
  totalInvestment: number;
  attributedRevenue: number;
  averageRoas: number;
  leads: number;
  sales: number;
}

export async function getClientsOverview(organizationId: string): Promise<{
  summary: ClientsOverviewSummary;
  clients: (ClientRecord & { metrics: ClientRowMetrics })[];
}> {
  const clients = await listClientsWithMetrics(organizationId);
  const activeClients = clients.filter((c) => c.status === "ATIVO").length;
  const totalInvestment = clients.reduce((sum, c) => sum + c.metrics.investment, 0);
  const attributedRevenue = clients.reduce((sum, c) => sum + c.metrics.revenue, 0);
  const leads = clients.reduce((sum, c) => sum + c.metrics.leads, 0);
  const sales = clients.reduce((sum, c) => sum + c.metrics.sales, 0);
  const averageRoas = totalInvestment > 0 ? attributedRevenue / totalInvestment : 0;

  return {
    summary: { activeClients, totalInvestment, attributedRevenue, averageRoas, leads, sales },
    clients,
  };
}
