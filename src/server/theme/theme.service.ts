import { cookies } from "next/headers";

import { DEFAULT_THEME, isTheme, THEME_COOKIE, type Theme } from "@/modules/theme/constants";

/**
 * Lê a preferência de tema salva em cookie — chamado pelo RootLayout (Server
 * Component) para renderizar `<html data-theme="...">` já correto na primeira
 * resposta HTML, sem flash de tema errado.
 */
export async function getServerTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : DEFAULT_THEME;
}
