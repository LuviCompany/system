import { BarChart3, DollarSign, Target, TrendingUp, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";

import { MetricCard } from "@/components/dashboard/metric-card";
import { ClientsTable } from "@/components/clientes/clients-table";
import { NewClientDrawer } from "@/components/clientes/new-client-drawer";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDecimal, formatNumber } from "@/lib/format";
import { requireSession } from "@/server/auth/session";
import { getClientsOverview } from "@/server/clients/client.service";
import { listTeamMembers } from "@/server/team/team.service";

export const metadata: Metadata = { title: "Visão geral dos clientes" };

export default async function ClientesOverviewPage() {
  const session = await requireSession();
  const [{ summary, clients }, teamMembers] = await Promise.all([
    getClientsOverview(session.organizationId),
    listTeamMembers(session.organizationId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-ink-900">Visão geral dos clientes</h1>
            <Badge variant="brand">Dados MOCK</Badge>
          </div>
          <p className="text-sm text-ink-500">Monitore a performance de todas as contas da Luvi em um só lugar.</p>
        </div>
        <NewClientDrawer teamMembers={teamMembers.map((m) => ({ id: m.id, name: m.name }))} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Clientes ativos" value={formatNumber(summary.activeClients)} icon={Users} accent />
        <MetricCard label="Investimento total" value={formatCurrency(summary.totalInvestment)} icon={Wallet} />
        <MetricCard label="Receita atribuída" value={formatCurrency(summary.attributedRevenue)} icon={DollarSign} />
        <MetricCard label="ROAS médio" value={formatDecimal(summary.averageRoas)} icon={TrendingUp} />
        <MetricCard label="Leads" value={formatNumber(summary.leads)} icon={Target} />
        <MetricCard label="Vendas" value={formatNumber(summary.sales)} icon={BarChart3} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-900">Todas as contas (últimos 30 dias)</h2>
        <ClientsTable clients={clients} />
      </div>
    </div>
  );
}
