"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

import { clientInputSchema } from "./client.schema";
import { createClient, getClientById, updateClient } from "./client.service";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createClientAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = clientInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const client = await createClient(session.organizationId, parsed.data);
  revalidatePath("/clientes");
  revalidatePath("/clientes/lista");
  return { ok: true, data: { id: client.id } };
}

export async function updateClientAction(clientId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = clientInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const client = await updateClient(session.organizationId, clientId, parsed.data);
  revalidatePath("/clientes");
  revalidatePath("/clientes/lista");
  revalidatePath(`/clientes/${clientId}`);
  return { ok: true, data: { id: client.id } };
}

export async function getClientDetailAction(clientId: string) {
  const session = await requireSession();
  const client = await getClientById(session.organizationId, clientId);
  if (!client) {
    return { ok: false as const, error: "Cliente não encontrado." };
  }
  return { ok: true as const, data: client };
}

/**
 * Alterna o status de conexão de uma plataforma de integração (etapa 26).
 * Nesta etapa não há OAuth real — apenas simula o card mudando de estado,
 * já pronto para receber o fluxo de autorização real de cada plataforma.
 */
export async function toggleClientPlatformAction(
  clientId: string,
  platform: "META_ADS" | "GOOGLE_ADS" | "INSTAGRAM" | "GOOGLE_ANALYTICS",
): Promise<ActionResult> {
  const session = await requireSession();
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: session.organizationId } });
  if (!client) {
    return { ok: false, error: "Cliente não encontrado." };
  }

  const existing = await prisma.clientPlatform.findUnique({ where: { clientId_platform: { clientId, platform } } });
  const nextStatus = existing?.status === "CONECTADO" ? "NAO_CONECTADO" : "CONECTADO";

  await prisma.clientPlatform.upsert({
    where: { clientId_platform: { clientId, platform } },
    update: { status: nextStatus, connectedAt: nextStatus === "CONECTADO" ? new Date() : null },
    create: { organizationId: session.organizationId, clientId, platform, status: nextStatus, connectedAt: nextStatus === "CONECTADO" ? new Date() : null },
  });

  revalidatePath(`/clientes/${clientId}/integracoes`);
  return { ok: true, data: undefined };
}
