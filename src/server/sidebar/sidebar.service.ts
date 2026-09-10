import { cookies } from "next/headers";

import { isCollapsedValue, SIDEBAR_COLLAPSED_COOKIE } from "@/modules/sidebar/constants";

/**
 * Lê a preferência de sidebar minimizada salva em cookie — chamado pelo
 * layout do grupo (dashboard) (Server Component) para renderizar a sidebar
 * já no estado certo na primeira resposta HTML, sem flash. Mesmo padrão de
 * server/theme/theme.service.ts.
 */
export async function getServerSidebarCollapsed(): Promise<boolean> {
  const cookieStore = await cookies();
  return isCollapsedValue(cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value);
}
