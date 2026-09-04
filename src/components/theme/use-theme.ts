"use client";

import { useCallback, useSyncExternalStore } from "react";

import { DEFAULT_THEME, THEME_COOKIE, type Theme } from "@/modules/theme/constants";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * `<html data-theme>` é a fonte da verdade (definida no servidor a partir do
 * cookie — server/theme/theme.service.ts + app/layout.tsx). `useSyncExternalStore`
 * lê esse atributo como um "external store": usa `getServerSnapshot` durante
 * SSR/hidratação (evita mismatch, já que o servidor não conhece `document`) e
 * troca para o valor real do DOM logo depois — e, via MutationObserver,
 * mantém múltiplas instâncias do toggle (Header + Configurações) sincronizadas
 * entre si sem re-render manual.
 */
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

/**
 * Grava o cookie diretamente no cliente (síncrono) em vez de via Server
 * Action. Isso é proposital: uma Server Action é assíncrona e, se o usuário
 * disparar logo em seguida qualquer navegação que force um novo render no
 * servidor (ex: `router.refresh()` do login), essa navegação pode vencer a
 * corrida e ler o cookie ainda com o valor antigo, revertendo o tema. Uma
 * escrita síncrona em `document.cookie` já está aplicada antes de qualquer
 * clique/navegação seguinte poder disparar.
 */
function persistThemeCookie(theme: Theme) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
}

/**
 * Fonte única da lógica de troca de tema — usada pelo botão do Header e pela
 * seção "Aparência" em Configurações, para não duplicar a lógica em dois
 * lugares.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    persistThemeCookie(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
