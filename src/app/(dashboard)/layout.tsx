import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { requireSession } from "@/server/auth/session";
import { listTodayAndOverdueFollowUps } from "@/server/followups/followup.service";
import { getOrganization } from "@/server/org/org.service";
import { getServerSidebarCollapsed } from "@/server/sidebar/sidebar.service";

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [organization, followUps, sidebarCollapsed] = await Promise.all([
    getOrganization(session.organizationId),
    listTodayAndOverdueFollowUps(session.organizationId, session),
    getServerSidebarCollapsed(),
  ]);

  const notifications = [
    ...followUps.overdue.map((item) => `Follow-up atrasado: ${item.lead.company}`),
    ...followUps.today.map((item) => `Follow-up hoje: ${item.lead.company}`),
  ].slice(0, 8);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar defaultCollapsed={sidebarCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          organizationName={organization.name}
          user={{ name: session.name, email: session.email, role: session.role }}
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
