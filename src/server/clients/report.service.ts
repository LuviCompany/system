import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { REPORT_METRIC_DEFS, REPORT_SECTION_DEFS } from "@/modules/clientes/constants";
import { buildInsights } from "@/modules/clientes/insights";

import type { ReportInput } from "./report.schema";
import { getBestAd, getBestCampaign, getClientFunnel, getClientPeriodComparison, getPerformanceByPlatform, listCampaignsWithMetrics } from "./performance.service";
import { getBestContent, getSocialOverview } from "./social.service";

const reportInclude = {
  client: true,
  sections: { orderBy: { order: "asc" } },
  metrics: true,
} satisfies Prisma.ReportInclude;

export type ReportRecord = Prisma.ReportGetPayload<{ include: typeof reportInclude }>;

export async function listReports(organizationId: string): Promise<ReportRecord[]> {
  return prisma.report.findMany({ where: { organizationId }, include: reportInclude, orderBy: { updatedAt: "desc" } });
}

export async function getReportById(organizationId: string, reportId: string): Promise<ReportRecord | null> {
  return prisma.report.findFirst({ where: { organizationId, id: reportId }, include: reportInclude });
}

export async function createReport(organizationId: string, input: ReportInput): Promise<ReportRecord> {
  const report = await prisma.report.create({
    data: {
      organizationId,
      clientId: input.clientId,
      title: input.title,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      platforms: input.platforms,
      status: "RASCUNHO",
      sections: { create: input.sections },
      metrics: { create: input.metrics },
    },
    include: reportInclude,
  });
  return report;
}

export async function updateReport(organizationId: string, reportId: string, input: ReportInput): Promise<ReportRecord> {
  const existing = await prisma.report.findFirst({ where: { organizationId, id: reportId } });
  if (!existing) throw new Error("Relatório não encontrado.");

  await prisma.$transaction([
    prisma.reportSection.deleteMany({ where: { reportId } }),
    prisma.reportMetric.deleteMany({ where: { reportId } }),
    prisma.report.update({
      where: { id: reportId },
      data: {
        clientId: input.clientId,
        title: input.title,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        platforms: input.platforms,
        sections: { create: input.sections },
        metrics: { create: input.metrics },
      },
    }),
  ]);

  return (await getReportById(organizationId, reportId))!;
}

export async function markReportReady(organizationId: string, reportId: string): Promise<void> {
  await prisma.report.updateMany({ where: { organizationId, id: reportId }, data: { status: "PRONTO" } });
}

export async function duplicateReport(organizationId: string, reportId: string): Promise<ReportRecord> {
  const original = await getReportById(organizationId, reportId);
  if (!original) throw new Error("Relatório não encontrado.");

  return prisma.report.create({
    data: {
      organizationId,
      clientId: original.clientId,
      title: `${original.title} (cópia)`,
      periodStart: original.periodStart,
      periodEnd: original.periodEnd,
      platforms: original.platforms,
      status: "RASCUNHO",
      sections: { create: original.sections.map((s) => ({ key: s.key, order: s.order, enabled: s.enabled })) },
      metrics: { create: original.metrics.map((m) => ({ key: m.key, enabled: m.enabled })) },
    },
    include: reportInclude,
  });
}

export async function deleteReport(organizationId: string, reportId: string): Promise<void> {
  await prisma.report.deleteMany({ where: { organizationId, id: reportId } });
}

/** Monta todo o conteúdo necessário para renderizar o preview/PDF de um relatório. */
export async function buildReportData(organizationId: string, reportId: string) {
  const report = await getReportById(organizationId, reportId);
  if (!report) return null;

  const period = { start: report.periodStart, end: report.periodEnd };
  const baseFilter = { organizationId, clientId: report.clientId, period };

  const [comparison, funnel, platformBreakdown, campaigns, bestCampaign, bestAd, bestContent, socialOverview] = await Promise.all([
    getClientPeriodComparison(baseFilter),
    getClientFunnel(baseFilter),
    getPerformanceByPlatform(baseFilter),
    listCampaignsWithMetrics(baseFilter),
    getBestCampaign(baseFilter),
    getBestAd(baseFilter),
    getBestContent(baseFilter),
    getSocialOverview(organizationId, period),
  ]);

  const insights = buildInsights(comparison);
  const clientSocial = socialOverview.clients.find((c) => c.clientId === report.clientId) ?? null;

  const enabledSections = report.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ key: s.key, label: REPORT_SECTION_DEFS.find((d) => d.key === s.key)?.label ?? s.key }));

  const enabledMetricKeys = new Set(report.metrics.filter((m) => m.enabled).map((m) => m.key));
  const enabledMetrics = REPORT_METRIC_DEFS.filter((m) => enabledMetricKeys.has(m.key));

  return {
    report,
    period,
    comparison,
    funnel,
    platformBreakdown,
    campaigns,
    bestCampaign,
    bestAd,
    bestContent,
    clientSocial,
    insights,
    enabledSections,
    enabledMetrics,
  };
}

export type ReportData = NonNullable<Awaited<ReturnType<typeof buildReportData>>>;
