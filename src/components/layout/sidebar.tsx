import { SidebarNav } from "@/components/layout/sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-60 shrink-0 border-r border-chrome-border bg-chrome-bg text-chrome-fg lg:block">
      <SidebarNav />
    </aside>
  );
}
