"use server";

import { revalidatePath } from "next/cache";
import type { IntegrationPlatform } from "@prisma/client";

import { requireSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import type { AccessibleAccount } from "@/server/integrations/ads-provider";

import { disconnectMeta, finalizeAccountSelection, getMetaConnection, listAccessibleAccountsForClient } from "./connection.service";
import { toMetaError } from "./errors";
import { syncInstagramForClient, syncMetaAdsForClient } from "./sync";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

type MetaPlatform = Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">;

/** Mesmo padrão de multi-tenant de server/integrations/google-ads/actions.ts. */
async function requireOwnedClient(clientId: string) {
  const session = await requireSession();
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: session.organizationId } });
  if (!client) {
    throw new Error("Cliente não encontrado.");
  }
  return session;
}

export async function syncMetaAction(clientId: string, platform: MetaPlatform): Promise<ActionResult<{ campaigns?: number; ads?: number; posts?: number }>> {
  const session = await requireOwnedClient(clientId);
  const result = platform === "META_ADS" ? await syncMetaAdsForClient(session.organizationId, clientId) : await syncInstagramForClient(session.organizationId, clientId);

  revalidatePath(`/clientes/${clientId}/integracoes`);
  revalidatePath(`/clientes/${clientId}`);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, data: result };
}

export async function disconnectMetaAction(clientId: string, platform: MetaPlatform): Promise<ActionResult> {
  const session = await requireOwnedClient(clientId);
  try {
    await disconnectMeta(session.organizationId, clientId, platform);
    revalidatePath(`/clientes/${clientId}/integracoes`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toMetaError(error).friendlyMessage };
  }
}

export async function getMetaConnectionAction(clientId: string, platform: MetaPlatform) {
  const session = await requireOwnedClient(clientId);
  return getMetaConnection(session.organizationId, clientId, platform);
}

export async function listMetaAdsAccountsAction(clientId: string): Promise<ActionResult<AccessibleAccount[]>> {
  const session = await requireOwnedClient(clientId);
  try {
    const accounts = await listAccessibleAccountsForClient(session.organizationId, clientId, "META_ADS");
    return { ok: true, data: accounts };
  } catch (error) {
    return { ok: false, error: toMetaError(error).friendlyMessage };
  }
}

export async function selectMetaAdsAccountAction(clientId: string, account: AccessibleAccount): Promise<ActionResult> {
  const session = await requireOwnedClient(clientId);
  try {
    await finalizeAccountSelection(session.organizationId, clientId, "META_ADS", account);
    revalidatePath(`/clientes/${clientId}/integracoes/meta`);
    revalidatePath(`/clientes/${clientId}/meta-ads`);
    revalidatePath(`/clientes/${clientId}/integracoes`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toMetaError(error).friendlyMessage };
  }
}
