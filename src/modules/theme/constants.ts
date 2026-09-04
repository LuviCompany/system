export const THEME_VALUES = ["dark", "light"] as const;
export type Theme = (typeof THEME_VALUES)[number];

export const DEFAULT_THEME: Theme = "dark";

/** Cookie usado para persistir a preferência de tema — lido no server (RootLayout) para não haver flash. */
export const THEME_COOKIE = "luvi_theme";

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

export const THEME_LABELS: Record<Theme, string> = {
  light: "Claro",
  dark: "Escuro",
};
