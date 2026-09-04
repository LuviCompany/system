import {
  Award,
  Compass,
  Copy,
  Handshake,
  Percent,
  Search,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";

import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ScoreBadge } from "@/components/leads/score-badge";
import { FollowUpList } from "@/components/followups/follow-up-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { requireSession } from "@/server/auth/session";
import { getDashboardData } from "@/server/dashboard/dashboard.service";
import { listTodayAndOverdueFollowUps } from "@/server/followups/followup.service";
import { getLeadSourcingStats } from "@/server/lead-sourcing/stats.service";

export const metadata: Metadata = { title: "Dashboard" };

function getGreetingPeriod(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function DashboardPage() {
  const session = await requireSession();
  const [{ summary, leadsByStage, leadsWithoutRecentActivity, proposalsAwaiting, topPriorityLeads }, followUps, sourcingStats] =
    await Promise.all([
      getDashboardData(session.organizationId, session),
      listTodayAndOverdueFollowUps(session.organizationId, session),
      getLeadSourcingStats(session.organizationId),
    ]);

  const firstName = session.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">
          {getGreetingPeriod()}, {firstName}.
        </h1>
        <p className="text-sm text-ink-500">Veja o desempenho da sua operação comercial.</p>
      </div>

      <div className="rounded-md border border-dashed border-border-strong bg-surface px-4 py-2 text-xs text-ink-500">
        As métricas abaixo são calculadas a partir dos leads cadastrados no seu workspace — os 22 leads iniciais são
        dados de demonstração gerados pelo seed do banco.
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Leads" value={formatNumber(summary.totalLeads)} icon={Users} />
        <MetricCard label="Leads qualificados" value={formatNumber(summary.qualifiedLeads)} icon={Target} />
        <MetricCard label="Reuniões" value={formatNumber(summary.meetings)} icon={Handshake} />
        <MetricCard label="Propostas" value={formatNumber(summary.proposals)} icon={TrendingUp} />
        <MetricCard label="Ganhos" value={formatNumber(summary.won)} icon={Trophy} accent />
        <MetricCard label="Pipeline" value={formatCurrency(summary.openPipelineValue)} icon={Wallet} accent />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Qualificação por ICP</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Qualificados pelo ICP" value={formatNumber(summary.icpQualifiedLeads)} icon={Compass} />
          <MetricCard label="Alta prioridade" value={formatNumber(summary.highPriorityLeads)} icon={Award} accent />
          <MetricCard label="Prioridade máxima" value={formatNumber(summary.maxPriorityLeads)} icon={Award} accent />
          <MetricCard label="% de alta aderência" value={`${summary.highAdherencePercent}%`} icon={Percent} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Aquisição via Google Places</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <MetricCard label="Encontrados hoje" value={formatNumber(sourcingStats.companiesFoundToday)} icon={Search} />
          <MetricCard label="Importados hoje" value={formatNumber(sourcingStats.leadsImportedToday)} icon={UserPlus} accent />
          <MetricCard label="Alta prioridade" value={formatNumber(sourcingStats.highPriorityToday)} icon={Award} />
          <MetricCard label="Prioridade máxima" value={formatNumber(sourcingStats.maxPriorityToday)} icon={Award} accent />
          <MetricCard label="Duplicados" value={formatNumber(sourcingStats.duplicatesToday)} icon={Copy} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Funil comercial</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <FunnelChart data={leadsByStage} />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Leads por etapa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {leadsByStage.map((stage) => (
              <div key={stage.stage} className="flex items-center justify-between text-sm">
                <span className="text-ink-600">{stage.label}</span>
                <Badge variant="neutral">{stage.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quem prospectar primeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {topPriorityLeads.length === 0 ? (
            <EmptyState title="Nenhum lead pontuado ainda." description="Ative um perfil de ICP para calcular as prioridades." />
          ) : (
            topPriorityLeads.map((lead, index) => (
              <div key={lead.id} className="flex items-center justify-between rounded-md border border-border bg-well px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink-400">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-ink-900">{lead.company}</p>
                    <p className="text-xs text-ink-500">{lead.responsavel}</p>
                  </div>
                </div>
                <ScoreBadge score={lead.icpScore} showLabel />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Follow-ups de hoje</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <FollowUpList items={followUps.today} emptyMessage="Nenhum follow-up para hoje." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Follow-ups atrasados</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <FollowUpList items={followUps.overdue} emptyMessage="Nenhum follow-up atrasado." />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Propostas aguardando retorno</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {proposalsAwaiting.length === 0 ? (
              <EmptyState title="Nenhuma proposta em aberto." />
            ) : (
              <div className="space-y-2">
                {proposalsAwaiting.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium text-ink-900">{item.company}</p>
                      <p className="text-xs text-ink-500">
                        {item.responsavel} · desde {formatDate(new Date(item.updatedAt))}
                      </p>
                    </div>
                    {item.potentialValue && (
                      <span className="font-mono text-sm text-ink-700">{formatCurrency(item.potentialValue)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads sem atividade recente</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {leadsWithoutRecentActivity.length === 0 ? (
              <EmptyState title="Todos os leads ativos têm atividade recente." />
            ) : (
              <div className="space-y-2">
                {leadsWithoutRecentActivity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium text-ink-900">{item.company}</p>
                      <p className="text-xs text-ink-500">{item.responsavel}</p>
                    </div>
                    <span className="text-xs text-ink-400">desde {formatDate(new Date(item.lastTouchAt))}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
