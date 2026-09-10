import { isMetaConfigured } from "../config";
import { mapMetaGraphError, MetaError, toMetaError } from "../errors";

const GRAPH_API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const REQUEST_TIMEOUT_MS = 20_000;

/** Client HTTP de baixo nível para a Meta Marketing API (somente leitura — etapa 7). */
export function getMetaGraphBaseUrl(): string {
  return BASE_URL;
}

interface MetaGraphListResponse<T> {
  data: T[];
  paging?: { next?: string };
}

/** GET genérico contra a Graph API, autenticado via `access_token` na query string (padrão da Graph API). */
async function getMetaGraph<T>(path: string, accessToken: string, searchParams?: Record<string, string>): Promise<T> {
  if (!isMetaConfigured()) {
    throw new MetaError("NOT_CONFIGURED", "Integração com Meta Ads não configurada.");
  }

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("access_token", accessToken);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal });
    const json = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw mapMetaGraphError(response.status, json);
    }
    return json as T;
  } catch (error) {
    throw toMetaError(error);
  } finally {
    clearTimeout(timeout);
  }
}

/** Segue `paging.next` (já vem com todos os query params, inclusive access_token) até esgotar as páginas. */
async function getAllPages<T>(firstPageUrl: string): Promise<T[]> {
  const rows: T[] = [];
  let nextUrl: string | undefined = firstPageUrl;

  while (nextUrl) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let json: MetaGraphListResponse<T>;

    try {
      const response = await fetch(nextUrl, { method: "GET", signal: controller.signal });
      const body = await response.json().catch(() => undefined);
      if (!response.ok) {
        throw mapMetaGraphError(response.status, body);
      }
      json = body as MetaGraphListResponse<T>;
    } catch (error) {
      throw toMetaError(error);
    } finally {
      clearTimeout(timeout);
    }

    rows.push(...(json.data ?? []));
    nextUrl = json.paging?.next;
  }

  return rows;
}

/** Genérico de baixo nível reaproveitado pelos stubs de Instagram (arquitetura preparada, não implementada nesta etapa — ver instagram/*.ts). */
export async function callMetaMarketingApi<T>(path: string, options: { accessToken: string }): Promise<T> {
  return getMetaGraph<T>(path, options.accessToken);
}

export interface MetaAdAccountRow {
  /** Vem como "act_123..." — o "act_" é removido pelo chamador antes de guardar (ver ads/provider.ts). */
  id: string;
  name?: string;
  currency?: string;
  account_status?: number;
}

/** GET /me/adaccounts — contas de anúncio acessíveis pelo token autorizado. */
export async function listAdAccounts(accessToken: string): Promise<MetaAdAccountRow[]> {
  const data = await getMetaGraph<{ data: MetaAdAccountRow[] }>("/me/adaccounts", accessToken, {
    fields: "id,name,currency,account_status",
  });
  return data.data ?? [];
}

export interface MetaCampaignStatusRow {
  id: string;
  status?: string;
}

/** GET /act_{id}/campaigns?fields=id,status — Insights não devolve status, então isto é buscado à parte (uma vez por sync). */
export async function fetchCampaignStatuses(externalAccountId: string, accessToken: string): Promise<Map<string, string>> {
  if (!isMetaConfigured()) {
    throw new MetaError("NOT_CONFIGURED", "Integração com Meta Ads não configurada.");
  }

  const url = new URL(`${BASE_URL}/act_${externalAccountId}/campaigns`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("fields", "id,status");
  url.searchParams.set("limit", "500");

  const rows = await getAllPages<MetaCampaignStatusRow>(url.toString());
  return new Map(rows.map((row) => [row.id, row.status ?? "UNKNOWN"]));
}

export interface MetaInsightsRow {
  [key: string]: unknown;
}

/** GET /act_{id}/insights — usado por ads/reporting.ts (nível campaign ou ad). */
export async function fetchInsights(
  externalAccountId: string,
  accessToken: string,
  params: { level: "campaign" | "ad"; fields: string[]; since: string; until: string },
): Promise<MetaInsightsRow[]> {
  if (!isMetaConfigured()) {
    throw new MetaError("NOT_CONFIGURED", "Integração com Meta Ads não configurada.");
  }

  const url = new URL(`${BASE_URL}/act_${externalAccountId}/insights`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("level", params.level);
  url.searchParams.set("fields", params.fields.join(","));
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("time_range", JSON.stringify({ since: params.since, until: params.until }));
  url.searchParams.set("limit", "500");

  return getAllPages<MetaInsightsRow>(url.toString());
}
