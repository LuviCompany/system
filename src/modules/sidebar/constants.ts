/** Cookie usado para persistir se a sidebar está minimizada — lido no server (dashboard layout) para não haver flash. */
export const SIDEBAR_COLLAPSED_COOKIE = "luvi_sidebar_collapsed";

export function isCollapsedValue(value: unknown): boolean {
  return value === "1";
}
