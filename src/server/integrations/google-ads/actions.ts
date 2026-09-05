"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import type { AccessibleAccount } from "@/server/integrations/ads-provider";

import { disconnectGoogleAds, finalizeAccountSelection, getGoogleAdsConnection, listAccessibleAccountsForClient } from "./connection.service";
import { toGoogleAdsError } from "./errors";
import { syncGoogleAdsForClient } from "./sync";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

/** Garante multi-tenant (etapa 6): o cliente precisa pertencer à organização da sessão atual. */
async function requireOwnedClient(clientId: string) {
  const session = await requireSession();
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: session.organizationId } });
  if (!client) {
    throw new Error("Cliente não encontrado.");
  }
  return session;
}

export async function listGoogleAdsAccountsAction(clientId: string): Promise<ActionResult<AccessibleAccount[]>> {
  const session = await requireOwnedClient(clientId);
  try {
    const accounts = await listAccessibleAccountsForClient(session.organizationId, clientId);
    return { ok: true, data: accounts };
  } catch (error) {
    return { ok: false, error: toGoogleAdsError(error).friendlyMessage };
  }
}

export async function selectGoogleAdsAccountAction(clientId: string, account: AccessibleAccount): Promise<ActionResult> {
  const session = await requireOwnedClient(clientId);
  try {
    await finalizeAccountSelection(session.organizationId, clientId, account);
    revalidatePath(`/clientes/${clientId}/integracoes/google`);
    revalidatePath(`/clientes/${clientId}/google-ads`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toGoogleAdsError(error).friendlyMessage };
  }
}

export async function syncGoogleAdsAction(clientId: string): Promise<ActionResult<{ campaigns: number; ads: number }>> {
  const session = await requireOwnedClient(clientId);
  const result = await syncGoogleAdsForClient(session.organizationId, clientId);
  revalidatePath(`/clientes/${clientId}/integracoes/google`);
  revalidatePath(`/clientes/${clientId}/google-ads`);
  revalidatePath(`/clientes/${clientId}`);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, data: { campaigns: result.campaigns, ads: result.ads } };
}

export async function disconnectGoogleAdsAction(clientId: string): Promise<ActionResult> {
  const session = await requireOwnedClient(clientId);
  try {
    await disconnectGoogleAds(session.organizationId, clientId);
    revalidatePath(`/clientes/${clientId}/integracoes/google`);
    revalidatePath(`/clientes/${clientId}/google-ads`);
    revalidatePath(`/clientes/${clientId}/integracoes`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toGoogleAdsError(error).friendlyMessage };
  }
}

export async function getGoogleAdsConnectionAction(clientId: string) {
  const session = await requireOwnedClient(clientId);
  return getGoogleAdsConnection(session.organizationId, clientId);
}
