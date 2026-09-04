import { PrismaClient } from "@prisma/client";
import type { ActivityType, LeadSource, PipelineStage, User } from "@prisma/client";

import { hashPassword } from "../src/server/auth/password";
import { DEFAULT_TAGS } from "../src/modules/leads/constants";
import { DEFAULT_RULE_TEMPLATES } from "../src/modules/icp/constants";
import { activateIcpProfile, createIcpProfile, type IcpProfileInput } from "../src/server/icp/icp.service";

const prisma = new PrismaClient();

const DEV_PASSWORD = "Luvi@2026";

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

const DIACRITICS_REGEX = new RegExp(String.fromCharCode(0x5b, 0x300, 0x2d, 0x36f, 0x5d), "g");

function slugifyForDomain(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "");
}

interface LeadSeed {
  company: string;
  contactName: string;
  segment: string;
  city: string;
  state: string;
  source: LeadSource;
  stage: PipelineStage;
  /** Não é mais gravado como icpScore (que agora é calculado) — usado só para
   * derivar dados de qualificação plausíveis e coerentes com a variação desejada. */
  qualityHint: number;
  potentialValue: number;
  tags: string[];
  responsavelIndex: number; // índice em `vendedores`
}

const LEAD_SEEDS: LeadSeed[] = [
  { company: "Aurora Cosméticos", contactName: "Marina Alves", segment: "E-commerce", city: "São Paulo", state: "SP", source: "GOOGLE_MAPS", stage: "GANHO", qualityHint: 92, potentialValue: 18000, tags: ["Alto potencial", "E-commerce"], responsavelIndex: 0 },
  { company: "Nortech Distribuidora", contactName: "Paulo Nogueira", segment: "Distribuição", city: "Curitiba", state: "PR", source: "INDICACAO", stage: "GANHO", qualityHint: 88, potentialValue: 24000, tags: ["Alto ticket"], responsavelIndex: 1 },
  { company: "Vitta Odontologia", contactName: "Dra. Camila Reis", segment: "Saúde", city: "Belo Horizonte", state: "MG", source: "INSTAGRAM", stage: "NEGOCIACAO", qualityHint: 81, potentialValue: 9600, tags: ["Alto potencial"], responsavelIndex: 0 },
  { company: "Bloom Moda Feminina", contactName: "Juliana Prado", segment: "Moda", city: "Porto Alegre", state: "RS", source: "SITE", stage: "PROPOSTA", qualityHint: 74, potentialValue: 15200, tags: ["E-commerce", "Tráfego pago"], responsavelIndex: 1 },
  { company: "Cresce Consultoria Jurídica", contactName: "Dr. Renato Lima", segment: "Serviços", city: "Brasília", state: "DF", source: "LINKEDIN", stage: "PERDIDO", qualityHint: 41, potentialValue: 6000, tags: ["Sem CRM"], responsavelIndex: 2 },
  { company: "Sabor Caseiro Alimentos", contactName: "Fernanda Costa", segment: "Alimentício", city: "Recife", state: "PE", source: "GOOGLE_MAPS", stage: "REUNIAO", qualityHint: 69, potentialValue: 8400, tags: ["Site ruim"], responsavelIndex: 2 },
  { company: "TechFix Assistência", contactName: "Diego Martins", segment: "Serviços técnicos", city: "Campinas", state: "SP", source: "OUTRO", stage: "CONTATO", qualityHint: 55, potentialValue: 5200, tags: ["Sem CRM", "Urgente"], responsavelIndex: 0 },
  { company: "Viva Bem Academia", contactName: "Rafael Souza", segment: "Fitness", city: "Florianópolis", state: "SC", source: "INSTAGRAM", stage: "PROSPECCAO", qualityHint: 63, potentialValue: 7300, tags: ["Tráfego pago"], responsavelIndex: 1 },
  { company: "Construtora Horizonte", contactName: "Eduardo Faria", segment: "Construção civil", city: "Goiânia", state: "GO", source: "EVENTO", stage: "QUALIFICADOS", qualityHint: 77, potentialValue: 32000, tags: ["Alto ticket", "Alto potencial"], responsavelIndex: 2 },
  { company: "Doce Ponto Confeitaria", contactName: "Larissa Nunes", segment: "Alimentício", city: "Salvador", state: "BA", source: "IMPORTACAO_CSV", stage: "NOVOS", qualityHint: 38, potentialValue: 2800, tags: [], responsavelIndex: 0 },
  { company: "Prime Contabilidade", contactName: "Marcos Vieira", segment: "Serviços financeiros", city: "Fortaleza", state: "CE", source: "SITE", stage: "NOVOS", qualityHint: 58, potentialValue: 6100, tags: ["Sem CRM"], responsavelIndex: 1 },
  { company: "Lumina Iluminação", contactName: "Beatriz Rocha", segment: "Varejo", city: "São Paulo", state: "SP", source: "GOOGLE_MAPS", stage: "NOVOS", qualityHint: 47, potentialValue: 4300, tags: ["Site ruim"], responsavelIndex: 2 },
  { company: "PetLar Produtos", contactName: "Gustavo Pinto", segment: "Pet", city: "Rio de Janeiro", state: "RJ", source: "INSTAGRAM", stage: "QUALIFICADOS", qualityHint: 71, potentialValue: 9800, tags: ["E-commerce"], responsavelIndex: 0 },
  { company: "Rota Norte Transportes", contactName: "Alexandre Souza", segment: "Logística", city: "Manaus", state: "AM", source: "INDICACAO", stage: "PROSPECCAO", qualityHint: 66, potentialValue: 21000, tags: ["Alto ticket"], responsavelIndex: 1 },
  { company: "Studio Fit Pilates", contactName: "Patrícia Gomes", segment: "Fitness", city: "Curitiba", state: "PR", source: "LINKEDIN", stage: "CONTATO", qualityHint: 52, potentialValue: 3900, tags: ["Urgente"], responsavelIndex: 2 },
  { company: "Bella Vista Imóveis", contactName: "Ricardo Tanaka", segment: "Imobiliário", city: "São Paulo", state: "SP", source: "SITE", stage: "REUNIAO", qualityHint: 84, potentialValue: 27500, tags: ["Alto potencial", "Alto ticket"], responsavelIndex: 0 },
  { company: "Verde Vida Paisagismo", contactName: "Sofia Andrade", segment: "Paisagismo", city: "Belo Horizonte", state: "MG", source: "GOOGLE_MAPS", stage: "PROPOSTA", qualityHint: 61, potentialValue: 7800, tags: ["Tráfego pago"], responsavelIndex: 1 },
  { company: "Nexo Tecnologia", contactName: "Bruno Cardoso", segment: "Tecnologia", city: "São Paulo", state: "SP", source: "EVENTO", stage: "NEGOCIACAO", qualityHint: 89, potentialValue: 41000, tags: ["Alto potencial", "Alto ticket", "Urgente"], responsavelIndex: 2 },
  { company: "Clínica Bem Estar", contactName: "Dra. Renata Alves", segment: "Saúde", city: "Vitória", state: "ES", source: "INSTAGRAM", stage: "PERDIDO", qualityHint: 35, potentialValue: 4600, tags: [], responsavelIndex: 0 },
  { company: "Grão Nobre Cafeteria", contactName: "Vinícius Barros", segment: "Alimentício", city: "Porto Alegre", state: "RS", source: "OUTRO", stage: "GANHO", qualityHint: 79, potentialValue: 5400, tags: ["E-commerce"], responsavelIndex: 1 },
  { company: "Multiserv Facilities", contactName: "Camila Duarte", segment: "Serviços", city: "Recife", state: "PE", source: "IMPORTACAO_CSV", stage: "QUALIFICADOS", qualityHint: 57, potentialValue: 13200, tags: ["Sem CRM"], responsavelIndex: 2 },
  { company: "Ártico Refrigeração", contactName: "Felipe Martins", segment: "Indústria", city: "Joinville", state: "SC", source: "GOOGLE_MAPS", stage: "PROSPECCAO", qualityHint: 68, potentialValue: 17600, tags: ["Alto ticket"], responsavelIndex: 0 },
];

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "luvi-company" },
    update: {},
    create: {
      name: "Luvi Company",
      slug: "luvi-company",
      domain: "luvicompany.com",
    },
  });

  const passwordHash = await hashPassword(DEV_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: "admin@luvicompany.com" },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Enzo Ribeiro",
      email: "admin@luvicompany.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const gestor = await prisma.user.upsert({
    where: { email: "gestor@luvicompany.com" },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Carla Menezes",
      email: "gestor@luvicompany.com",
      passwordHash,
      role: "GESTOR",
    },
  });

  const vendedor = await prisma.user.upsert({
    where: { email: "vendedor@luvicompany.com" },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Diego Fontes",
      email: "vendedor@luvicompany.com",
      passwordHash,
      role: "VENDEDOR",
    },
  });

  const vendedores: User[] = [admin, gestor, vendedor];

  const tagByName = new Map<string, { id: string }>();
  for (const name of DEFAULT_TAGS) {
    const tag = await prisma.tag.upsert({
      where: { organizationId_name: { organizationId: organization.id, name } },
      update: {},
      create: { organizationId: organization.id, name },
    });
    tagByName.set(name, tag);
  }

  let createdLeads = 0;
  for (const seed of LEAD_SEEDS) {
    const responsavel = vendedores[seed.responsavelIndex % vendedores.length];
    const createdAt = daysAgo(Math.floor(Math.random() * 60) + 3);

    // Deriva dados de qualificação plausíveis a partir do qualityHint (0-100),
    // mantendo variedade de segmento/faturamento/ticket/investimento/maturidade
    // sem precisar digitar 6 campos novos à mão para cada um dos 22 leads.
    // Curva ao quadrado (em vez de quase-linear) para que a diferença entre
    // um lead "morno" (qualityHint ~40) e um "quente" (~90) fique nítida no
    // score final, em vez de todo mundo terminar em ALTA/MÁXIMA.
    const q = seed.qualityHint;
    const curved = (q / 100) ** 2 * 100;
    const estimatedRevenue = Math.round((q / 100) ** 2.2 * 700000);
    const adSpend = Math.round((q / 100) ** 2 * 15000);
    const commercialMaturity = clamp(curved);
    const marketingNeed = clamp(curved + 8);
    const technologyNeed = clamp(curved - 10);
    const recurrencePotential = clamp(curved + 3);
    const hasInstagram = seed.tags.length > 0;

    const leadCoreData = {
      organizationId: organization.id,
      responsavelId: responsavel.id,
      company: seed.company,
      contactName: seed.contactName,
      position: "Responsável comercial",
      segment: seed.segment,
      city: seed.city,
      state: seed.state,
      source: seed.source,
      stage: seed.stage,
      potentialValue: seed.potentialValue,
      estimatedRevenue,
      adSpend,
      commercialMaturity,
      marketingNeed,
      technologyNeed,
      recurrencePotential,
      email: `${seed.contactName.split(" ")[0].toLowerCase()}@${slugifyForDomain(seed.company)}.com.br`,
      phone: "(11) 4000-0000",
      whatsapp: "(11) 99000-0000",
      website: `https://www.${slugifyForDomain(seed.company)}.com.br`,
      instagram: hasInstagram ? `@${slugifyForDomain(seed.company)}` : null,
      notes: "Lead de demonstração gerado pelo seed do LUVI CRM.",
    };

    // `update` espelha `create` (exceto id/createdAt/tags) para que reexecutar
    // o seed sempre sincronize os dados — um upsert com `update: {}` deixaria
    // leads já existentes de uma execução anterior sem os campos novos.
    const lead = await prisma.lead.upsert({
      where: { id: `seed-lead-${seed.company}` },
      update: leadCoreData,
      create: {
        id: `seed-lead-${seed.company}`,
        ...leadCoreData,
        createdAt,
        updatedAt: createdAt,
        tags: {
          create: seed.tags.map((tagName) => ({ tagId: tagByName.get(tagName)!.id })),
        },
      },
    });
    createdLeads += 1;

    await prisma.pipelineStageEvent.upsert({
      where: { id: `seed-event-${lead.id}-created` },
      update: {},
      create: {
        id: `seed-event-${lead.id}-created`,
        organizationId: organization.id,
        leadId: lead.id,
        userId: responsavel.id,
        fromStage: null,
        toStage: "NOVOS",
        createdAt,
      },
    });

    if (seed.stage !== "NOVOS") {
      await prisma.pipelineStageEvent.upsert({
        where: { id: `seed-event-${lead.id}-current` },
        update: {},
        create: {
          id: `seed-event-${lead.id}-current`,
          organizationId: organization.id,
          leadId: lead.id,
          userId: responsavel.id,
          fromStage: "NOVOS",
          toStage: seed.stage,
          createdAt: daysAgo(Math.max(1, Math.floor(Math.random() * 20))),
        },
      });
    }

    const activityType: ActivityType = seed.stage === "NOVOS" ? "NOTA" : "LIGACAO";
    await prisma.activity.upsert({
      where: { id: `seed-activity-${lead.id}` },
      update: {},
      create: {
        id: `seed-activity-${lead.id}`,
        organizationId: organization.id,
        leadId: lead.id,
        userId: responsavel.id,
        type: activityType,
        description:
          activityType === "NOTA"
            ? `Lead "${lead.company}" importado e aguardando primeiro contato.`
            : `Primeiro contato realizado com ${seed.contactName}.`,
        createdAt,
      },
    });
  }

  // Follow-ups: alguns hoje, alguns atrasados, alguns futuros.
  const followUpPlan: { leadCompany: string; offsetDays: number; note: string }[] = [
    { leadCompany: "Vitta Odontologia", offsetDays: 0, note: "Confirmar proposta enviada." },
    { leadCompany: "Bloom Moda Feminina", offsetDays: 0, note: "Retornar ligação sobre orçamento." },
    { leadCompany: "TechFix Assistência", offsetDays: -3, note: "Follow-up de qualificação atrasado." },
    { leadCompany: "Studio Fit Pilates", offsetDays: -1, note: "Cliente pediu retorno e não foi contatado." },
    { leadCompany: "Bella Vista Imóveis", offsetDays: 2, note: "Agendar reunião de fechamento." },
    { leadCompany: "Nexo Tecnologia", offsetDays: 1, note: "Enviar contraproposta." },
  ];

  for (const plan of followUpPlan) {
    const leadId = `seed-lead-${plan.leadCompany}`;
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) continue;

    const scheduledAt = plan.offsetDays >= 0 ? daysFromNow(plan.offsetDays) : daysAgo(Math.abs(plan.offsetDays));

    await prisma.followUp.upsert({
      where: { id: `seed-followup-${leadId}` },
      update: {},
      create: {
        id: `seed-followup-${leadId}`,
        organizationId: organization.id,
        leadId,
        responsavelId: lead.responsavelId ?? admin.id,
        scheduledAt,
        note: plan.note,
        status: "PENDENTE",
      },
    });

    await prisma.lead.update({ where: { id: leadId }, data: { nextFollowUpAt: scheduledAt } });
  }

  // Perfil de ICP padrão — pesos e faixas cobrindo os 11 critérios do motor
  // de pontuação (server/icp/scoring.ts). Ativado ao final, o que já
  // recalcula o ICP Score de todos os leads acima.
  const existingProfile = await prisma.icpProfile.findFirst({
    where: { organizationId: organization.id, name: "Perfil padrão Luvi" },
  });

  if (!existingProfile) {
    const highValueSegments = ["E-commerce", "Tecnologia", "Saúde", "Imobiliário"];
    const midValueSegments = ["Construção civil", "Distribuição", "Logística", "Indústria", "Moda", "Fitness"];
    const lowValueSegments = [
      "Serviços",
      "Alimentício",
      "Varejo",
      "Pet",
      "Paisagismo",
      "Serviços técnicos",
      "Serviços financeiros",
    ];
    const priorityStates = ["SP", "RJ", "MG", "PR", "SC", "RS"];
    const otherStates = ["DF", "PE", "GO", "BA", "CE", "AM", "ES"];

    const numericRules = (type: keyof typeof DEFAULT_RULE_TEMPLATES) =>
      DEFAULT_RULE_TEMPLATES[type].map((tier, index) => ({
        label: tier.label,
        order: index,
        minValue: tier.min,
        maxValue: tier.max,
        matchValues: [],
        score: tier.score,
      }));

    const profileInput: IcpProfileInput = {
      name: "Perfil padrão Luvi",
      description: "ICP inicial gerado pelo seed — ajuste os pesos e faixas conforme a realidade comercial da Luvi.",
      criteria: [
        { type: "FATURAMENTO", weight: 20, rules: numericRules("FATURAMENTO") },
        { type: "TICKET", weight: 15, rules: numericRules("TICKET") },
        { type: "INVESTIMENTO_TRAFEGO", weight: 15, rules: numericRules("INVESTIMENTO_TRAFEGO") },
        {
          type: "SEGMENTO",
          weight: 10,
          rules: [
            { label: "Alto valor", order: 0, minValue: null, maxValue: null, matchValues: highValueSegments, score: 90 },
            { label: "Médio valor", order: 1, minValue: null, maxValue: null, matchValues: midValueSegments, score: 60 },
            { label: "Baixo valor", order: 2, minValue: null, maxValue: null, matchValues: lowValueSegments, score: 30 },
          ],
        },
        {
          type: "LOCALIZACAO",
          weight: 10,
          rules: [
            { label: "Sul e Sudeste", order: 0, minValue: null, maxValue: null, matchValues: priorityStates, score: 80 },
            { label: "Demais regiões", order: 1, minValue: null, maxValue: null, matchValues: otherStates, score: 40 },
          ],
        },
        { type: "SITE", weight: 10, rules: [] },
        { type: "INSTAGRAM", weight: 5, rules: [] },
        { type: "MATURIDADE_COMERCIAL", weight: 5, rules: numericRules("MATURIDADE_COMERCIAL") },
        { type: "NECESSIDADE_MARKETING", weight: 5, rules: numericRules("NECESSIDADE_MARKETING") },
        { type: "NECESSIDADE_TECNOLOGIA", weight: 3, rules: numericRules("NECESSIDADE_TECNOLOGIA") },
        { type: "POTENCIAL_RECORRENCIA", weight: 2, rules: numericRules("POTENCIAL_RECORRENCIA") },
      ],
    };

    const profile = await createIcpProfile(organization.id, profileInput);
    await activateIcpProfile(organization.id, profile.id);
    console.log("  Perfil de ICP 'Perfil padrão Luvi' criado e ativado — scores recalculados.");
  } else {
    // Perfil já existia (reexecução do seed) — ainda assim recalcula, pois os
    // dados de qualificação dos leads podem ter sido atualizados acima.
    const active = await prisma.icpProfile.findFirst({ where: { organizationId: organization.id, isActive: true } });
    if (active) {
      await activateIcpProfile(organization.id, active.id);
      console.log("  Perfil de ICP ativo recalculado para todos os leads.");
    }
  }

  console.log("Seed do LUVI CRM concluído:");
  console.log(`  Organização: ${organization.name} (${organization.slug})`);
  console.log(`  Leads criados/atualizados: ${createdLeads}`);
  console.log("  Usuários de desenvolvimento (mesma senha para os três):");
  console.log(`    ADMIN     -> ${admin.email} / ${DEV_PASSWORD}`);
  console.log(`    GESTOR    -> ${gestor.email} / ${DEV_PASSWORD}`);
  console.log(`    VENDEDOR  -> ${vendedor.email} / ${DEV_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
