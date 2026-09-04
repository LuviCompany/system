import { prisma } from "@/server/db/prisma";

export interface LeadSourcingStats {
  companiesFoundToday: number;
  leadsImportedToday: number;
  highPriorityToday: number;
  maxPriorityToday: number;
  duplicatesToday: number;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Indicadores de "Aquisição via Google Places" para o Dashboard — sempre do
 * dia corrente, e sempre escopados à fonte Google (item 21). Buscas feitas
 * pelo provider mock (modo demonstração, sem GOOGLE_MAPS_API_KEY) não entram
 * aqui — são dados fictícios, não fariam sentido como métrica de aquisição.
 */
export async function getLeadSourcingStats(organizationId: string): Promise<LeadSourcingStats> {
  const todayFilter = {
    organizationId,
    createdAt: { gte: startOfToday() },
    searchQuery: { provider: "google_places" },
  };

  const [companiesFoundToday, leadsImportedToday, highPriorityToday, maxPriorityToday, duplicatesToday] = await Promise.all([
    prisma.leadSearchResult.count({ where: todayFilter }),
    prisma.leadSearchResult.count({ where: { ...todayFilter, status: "IMPORTED" } }),
    prisma.leadSearchResult.count({ where: { ...todayFilter, priority: "ALTA" } }),
    prisma.leadSearchResult.count({ where: { ...todayFilter, priority: "MAXIMA" } }),
    prisma.leadSearchResult.count({ where: { ...todayFilter, status: "DUPLICATE" } }),
  ]);

  return { companiesFoundToday, leadsImportedToday, highPriorityToday, maxPriorityToday, duplicatesToday };
}
