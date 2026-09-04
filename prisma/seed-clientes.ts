import { PrismaClient } from "@prisma/client";
import type { AdPlatform, SocialContentType, SocialPlatform, User } from "@prisma/client";

import { DEFAULT_REPORT_METRIC_KEYS, REPORT_SECTION_DEFS } from "../src/modules/clientes/constants";

const prisma = new PrismaClient();

/** PRNG determinístico (mulberry32) para que o seed seja reprodutível entre execuções. */
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}

function dayAt(daysAgoFromToday: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgoFromToday);
  return date;
}

interface ClientSeedDef {
  slug: string;
  name: string;
  tradeName: string;
  segment: string;
  cnpj: string;
  website: string;
  instagram: string;
  email: string;
  phone: string;
  baseInvestmentPerDay: number; // referência de investimento diário total
  baseRoas: number; // ROAS médio alvo do cliente
  trend: number; // -1 a 1: tendência do período recente (queda/crescimento)
}

const CLIENT_DEFS: ClientSeedDef[] = [
  {
    slug: "hugo-modas",
    name: "Hugo Modas Comércio de Roupas Ltda",
    tradeName: "Hugo Modas",
    segment: "Moda",
    cnpj: "12.345.678/0001-90",
    website: "https://www.hugomodas.com.br",
    instagram: "@hugomodas",
    email: "contato@hugomodas.com.br",
    phone: "(11) 4002-1001",
    baseInvestmentPerDay: 420,
    baseRoas: 4.1,
    trend: 0.18,
  },
  {
    slug: "vitta-odonto",
    name: "Vitta Odontologia Especializada Ltda",
    tradeName: "Vitta Odontologia",
    segment: "Saúde",
    cnpj: "23.456.789/0001-01",
    website: "https://www.vittaodonto.com.br",
    instagram: "@vittaodonto",
    email: "contato@vittaodonto.com.br",
    phone: "(31) 4002-1002",
    baseInvestmentPerDay: 260,
    baseRoas: 3.2,
    trend: 0.05,
  },
  {
    slug: "sabor-caseiro",
    name: "Sabor Caseiro Alimentos Ltda",
    tradeName: "Sabor Caseiro",
    segment: "Alimentício",
    cnpj: "34.567.890/0001-12",
    website: "https://www.saborcaseiro.com.br",
    instagram: "@saborcaseiro",
    email: "contato@saborcaseiro.com.br",
    phone: "(81) 4002-1003",
    baseInvestmentPerDay: 180,
    baseRoas: 2.6,
    trend: -0.22,
  },
  {
    slug: "viva-bem-academia",
    name: "Viva Bem Academia e Estúdio Ltda",
    tradeName: "Viva Bem Academia",
    segment: "Fitness",
    cnpj: "45.678.901/0001-23",
    website: "https://www.vivabemacademia.com.br",
    instagram: "@vivabemacademia",
    email: "contato@vivabemacademia.com.br",
    phone: "(48) 4002-1004",
    baseInvestmentPerDay: 210,
    baseRoas: 3.8,
    trend: 0.12,
  },
  {
    slug: "bella-vista-imoveis",
    name: "Bella Vista Imóveis Ltda",
    tradeName: "Bella Vista Imóveis",
    segment: "Imobiliário",
    cnpj: "56.789.012/0001-34",
    website: "https://www.bellavistaimoveis.com.br",
    instagram: "@bellavistaimoveis",
    email: "contato@bellavistaimoveis.com.br",
    phone: "(11) 4002-1005",
    baseInvestmentPerDay: 560,
    baseRoas: 5.1,
    trend: 0.08,
  },
];

const HISTORY_DAYS = 30;
const CAMPAIGN_DEFS: { platform: AdPlatform; name: string; objective: string; adNames: string[] }[] = [
  { platform: "META_ADS", name: "Conversão — Catálogo", objective: "Conversões", adNames: ["Carrossel coleção atual", "Vídeo depoimento"] },
  { platform: "META_ADS", name: "Reconhecimento — Topo de funil", objective: "Alcance", adNames: ["Imagem institucional"] },
  { platform: "GOOGLE_ADS", name: "Pesquisa — Marca + Genéricos", objective: "Leads", adNames: ["Anúncio de pesquisa 1", "Anúncio de pesquisa 2"] },
  { platform: "GOOGLE_ADS", name: "Performance Max", objective: "Vendas", adNames: ["Grupo de recursos principal"] },
];

const SOCIAL_CONTENT: { type: SocialContentType; label: string }[] = [
  { type: "IMAGEM", label: "Post de produto" },
  { type: "CARROSSEL", label: "Carrossel de bastidores" },
  { type: "REELS", label: "Reels de tendência" },
  { type: "VIDEO", label: "Vídeo institucional" },
  { type: "STORY", label: "Story de promoção" },
];

export async function seedClientes(organizationId: string, responsaveis: User[]): Promise<void> {
  let clientCount = 0;
  let campaignCount = 0;
  let adCount = 0;
  let metricCount = 0;
  let postCount = 0;
  let reportCount = 0;

  for (let clientIndex = 0; clientIndex < CLIENT_DEFS.length; clientIndex += 1) {
    const def = CLIENT_DEFS[clientIndex];
    const rand = mulberry32(hashString(def.slug));
    const responsavel = responsaveis[clientIndex % responsaveis.length];
    const clientId = `seed-client-${def.slug}`;

    const client = await prisma.client.upsert({
      where: { id: clientId },
      update: {
        name: def.name,
        tradeName: def.tradeName,
        segment: def.segment,
        cnpj: def.cnpj,
        website: def.website,
        instagram: def.instagram,
        email: def.email,
        phone: def.phone,
        responsavelId: responsavel.id,
        status: "ATIVO",
        health: def.trend >= 0 ? "SAUDAVEL" : def.trend > -0.15 ? "ATENCAO" : "CRITICO",
      },
      create: {
        id: clientId,
        organizationId,
        name: def.name,
        tradeName: def.tradeName,
        segment: def.segment,
        cnpj: def.cnpj,
        website: def.website,
        instagram: def.instagram,
        email: def.email,
        phone: def.phone,
        responsavelId: responsavel.id,
        status: "ATIVO",
        health: def.trend >= 0 ? "SAUDAVEL" : def.trend > -0.15 ? "ATENCAO" : "CRITICO",
      },
    });
    clientCount += 1;

    // Conexões — Meta Ads e Google Ads conectados (temos dados de campanha),
    // Instagram conectado (temos posts), Google Analytics não conectado nesta etapa.
    const platformSeeds: { platform: "META_ADS" | "GOOGLE_ADS" | "INSTAGRAM" | "GOOGLE_ANALYTICS"; status: "CONECTADO" | "NAO_CONECTADO"; accountLabel: string | null }[] = [
      { platform: "META_ADS", status: "CONECTADO", accountLabel: `Conta Meta — ${def.tradeName}` },
      { platform: "GOOGLE_ADS", status: "CONECTADO", accountLabel: `Conta Google Ads — ${def.tradeName}` },
      { platform: "INSTAGRAM", status: "CONECTADO", accountLabel: def.instagram },
      { platform: "GOOGLE_ANALYTICS", status: "NAO_CONECTADO", accountLabel: null },
    ];
    for (const p of platformSeeds) {
      await prisma.clientPlatform.upsert({
        where: { clientId_platform: { clientId: client.id, platform: p.platform } },
        update: { status: p.status, accountLabel: p.accountLabel },
        create: {
          organizationId,
          clientId: client.id,
          platform: p.platform,
          status: p.status,
          accountLabel: p.accountLabel,
          connectedAt: p.status === "CONECTADO" ? dayAt(90) : null,
        },
      });
    }

    // Campanhas + anúncios + métricas diárias.
    for (const campaignDef of CAMPAIGN_DEFS) {
      const campaignId = `${clientId}-camp-${campaignDef.name}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
      const campaign = await prisma.campaign.upsert({
        where: { id: campaignId },
        update: { name: campaignDef.name, objective: campaignDef.objective, platform: campaignDef.platform },
        create: {
          id: campaignId,
          organizationId,
          clientId: client.id,
          platform: campaignDef.platform,
          name: campaignDef.name,
          objective: campaignDef.objective,
          status: "ATIVA",
        },
      });
      campaignCount += 1;

      const ads = [];
      for (const adName of campaignDef.adNames) {
        const adId = `${campaignId}-ad-${adName}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
        const ad = await prisma.ad.upsert({
          where: { id: adId },
          update: { name: adName, platform: campaignDef.platform },
          create: {
            id: adId,
            organizationId,
            clientId: client.id,
            campaignId: campaign.id,
            platform: campaignDef.platform,
            name: adName,
            status: "ATIVA",
          },
        });
        ads.push(ad);
        adCount += 1;
      }

      // Investimento do dia é dividido entre os anúncios da campanha, com uma
      // parcela de sazonalidade + tendência (def.trend) para permitir
      // comparação de período coerente (período recente melhor/pior).
      const investmentShare = def.baseInvestmentPerDay / CAMPAIGN_DEFS.length / ads.length;

      const metricRows = [];
      for (let dayOffset = HISTORY_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
        const progress = 1 - dayOffset / HISTORY_DAYS; // 0 (mais antigo) -> 1 (mais recente)
        const trendFactor = 1 + def.trend * progress;
        const date = dayAt(dayOffset);

        for (const ad of ads) {
          const noise = 0.85 + rand() * 0.3;
          const investment = Math.round(investmentShare * trendFactor * noise * 100) / 100;
          const impressions = Math.round((investment / 0.02) * (0.9 + rand() * 0.2));
          const reach = Math.round(impressions * (0.55 + rand() * 0.15));
          const clicks = Math.round(impressions * (0.015 + rand() * 0.02));
          const leads = Math.round(clicks * (0.08 + rand() * 0.08));
          const sales = Math.round(leads * (0.12 + rand() * 0.1));
          const roasNoise = def.baseRoas * trendFactor * (0.85 + rand() * 0.3);
          const revenue = Math.round(investment * roasNoise * 100) / 100;

          metricRows.push({
            organizationId,
            clientId: client.id,
            campaignId: campaign.id,
            adId: ad.id,
            platform: campaignDef.platform,
            date,
            investment,
            reach,
            impressions,
            clicks,
            leads,
            sales,
            revenue,
          });
        }
      }

      // Idempotência simples: apaga métricas já existentes da campanha antes de
      // recriar, já que PerformanceMetric não tem chave natural única por linha.
      await prisma.performanceMetric.deleteMany({ where: { campaignId: campaign.id } });
      await prisma.performanceMetric.createMany({ data: metricRows });
      metricCount += metricRows.length;
    }

    // Social media — posts com métricas de engajamento; só o primeiro cliente
    // (índice 0) recebe dado individual de usuários engajados, para
    // demonstrar que esse dado é OPCIONAL e nunca inventado quando ausente.
    await prisma.socialPost.deleteMany({ where: { clientId: client.id } });
    for (let i = 0; i < 10; i += 1) {
      const contentDef = SOCIAL_CONTENT[i % SOCIAL_CONTENT.length];
      const platform: SocialPlatform = "INSTAGRAM";
      const publishedAt = dayAt(HISTORY_DAYS - 1 - i * 3);
      const reach = Math.round(1200 + rand() * 4200);
      const likes = Math.round(reach * (0.03 + rand() * 0.05));
      const comments = Math.round(likes * (0.05 + rand() * 0.08));
      const shares = Math.round(likes * (0.02 + rand() * 0.04));
      const saves = Math.round(likes * (0.04 + rand() * 0.06));

      const post = await prisma.socialPost.create({
        data: {
          organizationId,
          clientId: client.id,
          platform,
          type: contentDef.type,
          caption: `${contentDef.label} — ${def.tradeName}`,
          publishedAt,
          reach,
          likes,
          comments,
          shares,
          saves,
        },
      });
      postCount += 1;

      if (clientIndex === 0) {
        const topUsers = [
          { userIdentifier: "@usuario01", interactionCount: 44 },
          { userIdentifier: "@usuario02", interactionCount: 38 },
          { userIdentifier: "@usuario03", interactionCount: 31 },
        ];
        await prisma.socialEngagement.createMany({
          data: topUsers.map((u) => ({
            organizationId,
            postId: post.id,
            userIdentifier: u.userIdentifier,
            interactionCount: u.interactionCount,
            engagementSource: "instagram_insights_mock",
          })),
        });
      }
    }

    // Relatório de exemplo — seções e métricas padrão, período dos últimos 30 dias.
    const reportId = `seed-report-${def.slug}`;
    const report = await prisma.report.upsert({
      where: { id: reportId },
      update: {
        title: `Relatório de performance — ${def.tradeName}`,
        periodStart: dayAt(HISTORY_DAYS - 1),
        periodEnd: dayAt(0),
      },
      create: {
        id: reportId,
        organizationId,
        clientId: client.id,
        title: `Relatório de performance — ${def.tradeName}`,
        periodStart: dayAt(HISTORY_DAYS - 1),
        periodEnd: dayAt(0),
        platforms: ["META_ADS", "GOOGLE_ADS"],
        status: "PRONTO",
      },
    });
    reportCount += 1;

    await prisma.reportSection.deleteMany({ where: { reportId: report.id } });
    await prisma.reportSection.createMany({
      data: REPORT_SECTION_DEFS.map((s, order) => ({ reportId: report.id, key: s.key, order, enabled: true })),
    });

    await prisma.reportMetric.deleteMany({ where: { reportId: report.id } });
    await prisma.reportMetric.createMany({
      data: DEFAULT_REPORT_METRIC_KEYS.map((key) => ({ reportId: report.id, key, enabled: true })),
    });
  }

  console.log("Seed do módulo LUVI CLIENTES concluído:");
  console.log(`  Clientes: ${clientCount}`);
  console.log(`  Campanhas: ${campaignCount} | Anúncios: ${adCount} | Métricas diárias: ${metricCount}`);
  console.log(`  Posts sociais: ${postCount} | Relatórios: ${reportCount}`);
}
