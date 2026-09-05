import { getGoogleAdsCredentials, GOOGLE_ADS_API_VERSION } from "./config";
import { GoogleAdsError, mapGoogleAdsApiError, toGoogleAdsError } from "./errors";

const BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;
const REQUEST_TIMEOUT_MS = 20_000;

interface GoogleAdsRequestOptions {
  accessToken: string;
  /** login-customer-id de uma conta MCC — só necessário quando a conta escolhida é gerenciada por um Manager Account. */
  loginCustomerId?: string | null;
}

async function callGoogleAdsApi<T>(path: string, init: RequestInit, options: GoogleAdsRequestOptions): Promise<T> {
  const credentials = getGoogleAdsCredentials();
  if (!credentials) {
    throw new GoogleAdsError("NOT_CONFIGURED", "Integração com Google Ads não configurada.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${options.accessToken}`,
        "developer-token": credentials.developerToken,
        ...(options.loginCustomerId ? { "login-customer-id": options.loginCustomerId } : {}),
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    const json = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw mapGoogleAdsApiError(response.status, json);
    }

    return json as T;
  } catch (error) {
    throw toGoogleAdsError(error);
  } finally {
    clearTimeout(timeout);
  }
}

interface ListAccessibleCustomersResponse {
  resourceNames: string[];
}

/** GET customers:listAccessibleCustomers — devolve os resource names ("customers/1234567890") acessíveis pelo token. */
export async function listAccessibleCustomers(accessToken: string): Promise<string[]> {
  const data = await callGoogleAdsApi<ListAccessibleCustomersResponse>(
    "/customers:listAccessibleCustomers",
    { method: "GET" },
    { accessToken },
  );
  return data.resourceNames ?? [];
}

export interface GoogleAdsSearchRow {
  [key: string]: unknown;
}

interface SearchResponse {
  results?: GoogleAdsSearchRow[];
  nextPageToken?: string;
}

/**
 * Executa uma query GAQL (somente leitura — etapa 21) contra
 * customers/{customerId}/googleAds:search. Pagina automaticamente até
 * esgotar os resultados.
 */
export async function searchGoogleAds(
  customerId: string,
  query: string,
  options: GoogleAdsRequestOptions,
): Promise<GoogleAdsSearchRow[]> {
  const rows: GoogleAdsSearchRow[] = [];
  let pageToken: string | undefined;

  do {
    const data = await callGoogleAdsApi<SearchResponse>(
      `/customers/${customerId}/googleAds:search`,
      {
        method: "POST",
        body: JSON.stringify({ query, pageToken, pageSize: 1000 }),
      },
      options,
    );
    rows.push(...(data.results ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return rows;
}
