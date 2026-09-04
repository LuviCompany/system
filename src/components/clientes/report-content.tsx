import { Trophy } from "lucide-react";

import { FunnelSteps } from "@/components/clientes/funnel-steps";
import { formatCurrency, formatDate, formatDecimal, formatNumber, formatPercent } from "@/lib/format";
import { AD_PLATFORM_LABELS, SOCIAL_CONTENT_TYPE_LABELS, type ReportMetricKey } from "@/modules/clientes/constants";
import type { ReportData } from "@/server/clients/report.service";

const METRIC_VALUE: Record<string, (data: ReportData) => string> = {
  investimento: (d) => formatCurrency(d.comparison.current.investment),
  alcance: (d) => formatNumber(d.comparison.current.reach),
  impressoes: (d) => formatNumber(d.comparison.current.impressions),
  cliques: (d) => formatNumber(d.comparison.current.clicks),
  ctr: (d) => formatPercent(d.comparison.current.ctr),
  cpc: (d) => formatCurrency(d.comparison.current.cpc, true),
  leads: (d) => formatNumber(d.comparison.current.leads),
  cpl: (d) => formatCurrency(d.comparison.current.cpl, true),
  vendas: (d) => formatNumber(d.comparison.current.sales),
  cpa: (d) => formatCurrency(d.comparison.current.cpa, true),
  receita: (d) => formatCurrency(d.comparison.current.revenue),
  roas: (d) => formatDecimal(d.comparison.current.roas),
};

const METRIC_LABEL: Record<string, string> = {
  investimento: "Investimento",
  alcance: "Alcance",
  impressoes: "Impressões",
  cliques: "Cliques",
  ctr: "CTR",
  cpc: "CPC",
  leads: "Leads",
  cpl: "CPL",
  vendas: "Vendas",
  cpa: "CPA",
  receita: "Receita",
  roas: "ROAS",
};

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid space-y-3 border-b border-border pb-6 last:border-0">
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      {children}
    </section>
  );
}

/** Conteúdo de um relatório (etapas 19-25) — compartilhado entre o preview e a página de exportação em PDF. */
export function ReportContent({ data }: { data: ReportData }) {
  const { report, comparison, funnel, platformBreakdown, campaigns, bestCampaign, bestAd, clientSocial, insights, enabledSections, enabledMetrics } = data;
  const metricKeys = new Set<ReportMetricKey>(enabledMetrics.map((m) => m.key));
  const summaryMetricKeys = Object.keys(METRIC_VALUE).filter((k) => metricKeys.has(k as ReportMetricKey));

  return (
    <article className="space-y-8">
      <header className="space-y-1 border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Luvi Company</p>
        <h1 className="text-2xl font-semibold text-ink-900">{report.title}</h1>
        <p className="text-sm text-ink-500">
          {report.client.tradeName ?? report.client.name} · {formatDate(report.periodStart)} a {formatDate(report.periodEnd)}
        </p>
      </header>

      {enabledSections.map((section) => {
        switch (section.key) {
          case "resumo":
            return (
              <ReportSection key={section.key} title="Resumo executivo">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {summaryMetricKeys.map((key) => (
                    <div key={key} className="rounded-md border border-border p-3">
                      <p className="text-xs text-ink-500">{METRIC_LABEL[key]}</p>
                      <p className="font-mono text-lg font-semibold text-ink-900">{METRIC_VALUE[key](data)}</p>
                    </div>
                  ))}
                </div>
              </ReportSection>
            );
          case "meta_ads":
          case "google_ads": {
            const platform = section.key === "meta_ads" ? "META_ADS" : "GOOGLE_ADS";
            const metrics = platformBreakdown.find((p) => p.platform === platform)!;
            return (
              <ReportSection key={section.key} title={AD_PLATFORM_LABELS[platform]}>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
                  <div><dt className="text-xs text-ink-500">Investimento</dt><dd className="font-medium text-ink-900">{formatCurrency(metrics.investment)}</dd></div>
                  <div><dt className="text-xs text-ink-500">Impressões</dt><dd className="font-medium text-ink-900">{formatNumber(metrics.impressions)}</dd></div>
                  <div><dt className="text-xs text-ink-500">Cliques</dt><dd className="font-medium text-ink-900">{formatNumber(metrics.clicks)}</dd></div>
                  <div><dt className="text-xs text-ink-500">CTR</dt><dd className="font-medium text-ink-900">{formatPercent(metrics.ctr)}</dd></div>
                  <div><dt className="text-xs text-ink-500">Conversões</dt><dd className="font-medium text-ink-900">{formatNumber(metrics.sales)}</dd></div>
                  <div><dt className="text-xs text-ink-500">CPA</dt><dd className="font-medium text-ink-900">{formatCurrency(metrics.cpa, true)}</dd></div>
                  <div><dt className="text-xs text-ink-500">Receita</dt><dd className="font-medium text-ink-900">{formatCurrency(metrics.revenue)}</dd></div>
                  <div><dt className="text-xs text-ink-500">ROAS</dt><dd className="font-medium text-ink-900">{formatDecimal(metrics.roas)}</dd></div>
                </dl>
              </ReportSection>
            );
          }
          case "funil":
            return (
              <ReportSection key={section.key} title="Funil de performance">
                <FunnelSteps steps={funnel} />
              </ReportSection>
            );
          case "campanhas":
            return (
              <ReportSection key={section.key} title="Campanhas">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-ink-500">
                      <th className="py-2">Campanha</th>
                      <th className="py-2">Plataforma</th>
                      <th className="py-2 text-right">Investimento</th>
                      <th className="py-2 text-right">Receita</th>
                      <th className="py-2 text-right">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0">
                        <td className="py-2 text-ink-900">{c.name}</td>
                        <td className="py-2 text-ink-500">{AD_PLATFORM_LABELS[c.platform]}</td>
                        <td className="py-2 text-right">{formatCurrency(c.metrics.investment)}</td>
                        <td className="py-2 text-right">{formatCurrency(c.metrics.revenue)}</td>
                        <td className="py-2 text-right">{formatDecimal(c.metrics.roas)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {metricKeys.has("melhor_campanha") && bestCampaign && (
                  <p className="flex items-center gap-2 text-sm text-ink-700">
                    <Trophy className="h-4 w-4 text-brand-500" aria-hidden />
                    Melhor campanha: <strong>{bestCampaign.name}</strong> (ROAS {formatDecimal(bestCampaign.metrics.roas)})
                  </p>
                )}
              </ReportSection>
            );
          case "anuncios":
            return (
              <ReportSection key={section.key} title="Anúncios">
                {metricKeys.has("melhor_anuncio") && bestAd ? (
                  <p className="flex items-center gap-2 text-sm text-ink-700">
                    <Trophy className="h-4 w-4 text-brand-500" aria-hidden />
                    Melhor anúncio: <strong>{bestAd.name}</strong> ({bestAd.campaignName}) — ROAS {formatDecimal(bestAd.metrics.roas)}
                  </p>
                ) : (
                  <p className="text-sm text-ink-500">Sem anúncios com dados no período.</p>
                )}
              </ReportSection>
            );
          case "social_media":
            return (
              <ReportSection key={section.key} title="Social Media">
                {!clientSocial ? (
                  <p className="text-sm text-ink-500">Sem dados de social media no período.</p>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
                    <div><dt className="text-xs text-ink-500">Posts</dt><dd className="font-medium text-ink-900">{formatNumber(clientSocial.posts)}</dd></div>
                    <div><dt className="text-xs text-ink-500">Alcance</dt><dd className="font-medium text-ink-900">{formatNumber(clientSocial.reach)}</dd></div>
                    <div><dt className="text-xs text-ink-500">Engajamento</dt><dd className="font-medium text-ink-900">{formatNumber(clientSocial.engagement)}</dd></div>
                    <div><dt className="text-xs text-ink-500">Seguidores</dt><dd className="font-medium text-ink-900">{formatNumber(clientSocial.followers)}</dd></div>
                  </dl>
                )}
                {metricKeys.has("melhor_conteudo") && data.bestContent && (
                  <p className="flex items-center gap-2 text-sm text-ink-700">
                    <Trophy className="h-4 w-4 text-brand-500" aria-hidden />
                    Melhor conteúdo: <strong>{data.bestContent.caption ?? SOCIAL_CONTENT_TYPE_LABELS[data.bestContent.type]}</strong>
                  </p>
                )}
              </ReportSection>
            );
          case "insights":
            return (
              <ReportSection key={section.key} title="Insights">
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-700">
                  {insights.map((insight, index) => (
                    <li key={index}>{insight.text}</li>
                  ))}
                </ul>
              </ReportSection>
            );
          case "conclusao":
            return (
              <ReportSection key={section.key} title="Conclusão">
                <p className="text-sm text-ink-700">
                  No período de {formatDate(report.periodStart)} a {formatDate(report.periodEnd)}, o investimento total foi de{" "}
                  {formatCurrency(comparison.current.investment)}, gerando {formatCurrency(comparison.current.revenue)} em receita
                  atribuída (ROAS de {formatDecimal(comparison.current.roas)}). Relatório gerado pela Luvi Company.
                </p>
              </ReportSection>
            );
          default:
            return null;
        }
      })}
    </article>
  );
}
