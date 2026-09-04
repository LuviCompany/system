import { prisma } from "@/server/db/prisma";

export async function listTags(organizationId: string) {
  return prisma.tag.findMany({ where: { organizationId }, orderBy: { name: "asc" } });
}

export async function findOrCreateTag(organizationId: string, name: string, color?: string) {
  const trimmed = name.trim();
  return prisma.tag.upsert({
    where: { organizationId_name: { organizationId, name: trimmed } },
    update: {},
    create: { organizationId, name: trimmed, color: color ?? "#71717e" },
  });
}
