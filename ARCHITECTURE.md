# Arquitetura — LUVI CRM

Este documento explica **por quê** o projeto foi montado desta forma e registra as decisões tomadas onde o briefing não especificava um comportamento exato.

## 0. O pivô: de "LUVI Intelligence" para "LUVI CRM"

O projeto começou como um dashboard de métricas de mídia paga (Meta/Google Ads) para os **clientes** da agência. Numa sessão seguinte, o briefing pediu um **CRM de prospecção e vendas** para a própria **equipe comercial da Luvi**, com uma navegação e um conjunto de entidades completamente diferentes (Leads, Pipeline, ICP, Follow-ups...).

Decisão registrada: tratar isso como um pivô de produto, não uma adição. As páginas, componentes e tabelas do banco específicos do produto antigo (Clientes-como-cliente-de-mídia, Campanhas, Analytics de plataformas, Integrações Meta/Google/GA) foram **removidos**, não deixados como código morto ao lado do CRM. Motivo: o briefing pediu explicitamente "elimine a aparência genérica" e "o resultado deve parecer um sistema desenvolvido pela própria Luvi, não um template adaptado" — manter duas navegações concorrentes teria o efeito oposto. O design system (`components/ui`), a base de autenticação e o modelo multi-tenant foram preservados e estendidos.

## 1. Multi-tenant e papéis

Toda entidade de negócio pertence a uma `Organization` (`prisma/schema.prisma`) e toda query em `server/` filtra por `organizationId` — nunca há uma tabela de domínio sem dono. Isolamento é responsabilidade da camada de aplicação (sem Row-Level Security no Postgres nesta etapa).

Três papéis (`UserRole`): **ADMIN**, **GESTOR**, **VENDEDOR**. Regras implementadas:

- **VENDEDOR** só enxerga os leads em que é o responsável (`Leads`, `Pipeline`, `Dashboard`, `Qualificação` todos filtram por `responsavelId = session.userId` quando `role === "VENDEDOR"` — ver `scopeToViewer()` em cada `*.service.ts`). Isso não estava explicitado no briefing ("implementar permissões nas páginas e ações"); é a leitura mais comum desse requisito para um CRM comercial e está documentada aqui para poder ser revista.
- **ADMIN** e **GESTOR** enxergam todos os leads da organização.
- `/equipe` (gestão de usuários) é acessível para **ADMIN** e **GESTOR**, mas somente **ADMIN** pode criar usuários, alterar papel ou ativar/desativar (`requireRole(["ADMIN"])` nas Server Actions de `server/team/actions.ts` — a página em si usa `requireRole(["ADMIN","GESTOR"])`, e a UI só renderiza os controles de edição quando `session.role === "ADMIN"`).
- `/configuracoes` (dados da organização) é visível a todos, mas o formulário só é editável por **ADMIN**.
- ICP, Atividades e Follow-ups não têm restrição adicional além do escopo de leads acima.

## 2. Autenticação

Implementação própria (sem NextAuth/Auth.js), pelos mesmos motivos documentados desde a primeira versão: controle direto do payload de sessão multi-tenant (`organizationId` e `role` no token, sem consulta extra por request) e evitar uma dependência de auth ainda instável para o App Router.

- Senha com hash `bcrypt` (custo 12).
- Login emite um JWT assinado (`jose`) com `userId`, `organizationId`, `role`, `name`, `email`, guardado em cookie `httpOnly`, `sameSite=lax`, `secure` em produção.
- **Proteção de rotas** (`src/proxy.ts`, o antigo "middleware" do Next.js): roda em todas as rotas exceto `/api/auth/*`, assets estáticos e o `/icon`. Verifica a assinatura do JWT (não só a presença do cookie) e decide:
  - sem sessão válida em rota interna → redireciona para `/login?from=<rota>`;
  - sessão válida em `/login` → redireciona para `/dashboard`.
- Segunda camada de defesa: cada página/layout dentro de `(dashboard)` chama `requireSession()` (ou `requireRole()`), que redireciona para `/login` se o token expirou entre a checagem do proxy e o render da página.
- Usuários podem ser desativados (`User.active`); login de um usuário inativo é bloqueado com uma mensagem específica (`UserInactiveError`, HTTP 403).
- Logout (`POST /api/auth/logout`) apaga o cookie de sessão — como a sessão é um JWT sem estado no servidor, "invalidar" significa remover o único lugar onde ele existe (o cookie do navegador). Não há uma tabela de sessões para revogar; um token roubado continua válido até expirar (7 dias). Ver seção 6 (Pendências de segurança) para o que fazer quando isso importar de verdade.

## 3. Design System LUVI

- **Cor de marca oficial**: `#FF3B00`, definida uma única vez em `src/app/globals.css` (bloco `@theme`, variável `--color-brand-500`) e derivada em uma escala 50–950 a partir desse valor exato. Qualquer ajuste de tom é feito **só ali** — nenhum componente tem a cor hardcoded.
- Uso deliberadamente comedido do laranja: reservado a CTAs, estado ativo da navegação (borda esquerda + fundo), badges de destaque (Ganhos, Pipeline) e barras de gráfico. O restante da interface é neutro (cinzas, sidebar escura, texto escuro sobre superfícies claras), conforme pedido.
- **Logo oficial**: o arquivo de imagem enviado no chat não pôde ser salvo em disco automaticamente — esta sessão não dispõe de uma ferramenta para exportar uma imagem colada na conversa para um arquivo do repositório. Um wordmark tipográfico "LUVI" na cor de marca é usado como placeholder (`src/components/brand/logo.tsx`), com instruções no próprio arquivo para a troca pelo PNG/SVG oficial assim que ele existir em `public/brand/`.
- Tipografia: Inter (interface) + JetBrains Mono (números — métricas, valores, ICP score), mantido da fundação anterior por já cumprir bem o pedido de "tecnologia e clareza".

## 4. Modelo de dados (`prisma/schema.prisma`)

Entidades centradas em `Lead`:

```
Organization
 └─ User (role: ADMIN | GESTOR | VENDEDOR)
 └─ Lead
     ├─ LeadTag ↔ Tag
     ├─ Activity        (timeline: ligação, whatsapp, nota, reunião...)
     ├─ FollowUp        (agendamento; status PENDENTE/CONCLUIDO)
     └─ PipelineStageEvent  (histórico de mudança de etapa, para auditoria)
 └─ IcpCriteria (perfis de cliente ideal, cadastro manual)
```

Decisões:

- `LeadTag` é uma tabela de junção explícita (não m-n implícito do Prisma) para poder indexar por `tagId` e manter a modelagem explícita, já que tags são um conceito de primeira classe no produto (filtro, badge, seed).
- `PipelineStageEvent` grava `fromStage`/`toStage` a cada movimentação (drag-and-drop ou pelo seletor) — é o que a página `/pipeline` chama de "registrar automaticamente alteração no histórico".
- Não existe um "high-water mark" de etapa (maior etapa já alcançada) — as métricas do dashboard usam a **etapa atual** do lead, não um funil cumulativo histórico. Ver seção 5.

## 5. Dashboard — como as métricas são calculadas

O briefing de dashboard trazia números de exemplo fixos ("Leads 428", "Pipeline R$184.500"...). Diferente da etapa anterior (que não tinha banco e por isso usava dados 100% mock), aqui o CRM já persiste leads reais — manter números fixos que não batem com a lista de 22 leads reais (a um clique de distância, em `/leads`) pareceria um bug, não uma demonstração. Decisão: o dashboard **calcula** as métricas a partir do banco (`server/dashboard/dashboard.service.ts`):

- **Leads**: total visível para o usuário (respeitando o escopo de VENDEDOR).
- **Leads qualificados**: `stage NOT IN (NOVOS, PERDIDO)`.
- **Reuniões / Propostas / Ganhos**: contagem de leads cuja etapa **atual** é `REUNIAO` / `PROPOSTA` / `GANHO` (não é uma contagem cumulativa de "passou por essa etapa alguma vez", pois isso exigiria um high-water mark que o modelo não guarda).
- **Pipeline**: soma de `potentialValue` dos leads que não estão em `GANHO` nem `PERDIDO`.
- **Leads sem atividade recente**: leads ativos cuja atividade mais recente (ou a criação, se nunca houve atividade) é anterior a 7 dias.

Os 22 leads iniciais continuam sendo dados de demonstração (gerados pelo `seed.ts`), e a interface deixa isso explícito.

## 6. Segurança — feito e pendências conhecidas

Feito:
- Sem segredos no frontend; `.env` fora do controle de versão; `.env.example` documentado.
- Senhas sempre com hash (`bcrypt`, nunca texto puro).
- Cookie de sessão `httpOnly` + `secure` em produção.
- Erros de login não distinguem "e-mail não existe" de "senha errada".
- Todas as Server Actions validam entrada com Zod e checam sessão/papel antes de tocar no banco.

Pendências conhecidas (fora do escopo desta etapa, registradas para não serem esquecidas):
- Sessão é um JWT sem estado — não há como revogar um token individual antes de expirar (7 dias). Para revogação imediata (ex: usuário demitido), seria necessário um `sessionVersion` no `User` verificado a cada request, ou uma tabela de sessões.
- `npm audit` aponta uma vulnerabilidade *high* em `deepmerge-ts`, dependência transitiva do **Prisma CLI** (ferramenta de desenvolvimento, não do `@prisma/client` em runtime). Acompanhar novas releases do Prisma 6.x.
- Criação de usuário em `/equipe` usa uma senha temporária definida pelo admin (sem convite por e-mail real, conforme pedido) — o ADMIN precisa repassar essa senha por um canal seguro; não há fluxo de "trocar senha no primeiro acesso" nesta etapa.

## 7. Onde as próximas integrações entram

- **Encontrar Leads**: funcional com um provider mock — ver seção 9. A implementação futura de uma fonte real (Google Places, etc.) entra implementando a interface `SearchProvider` (`src/server/lead-sourcing/types.ts`) e trocando a escolha em `src/server/lead-sourcing/provider.ts`; nenhum outro código muda.
- **Google Ads e Meta Ads**: ambos já são integrações reais, somente leitura, via OAuth — ver `docs/google-ads.md` e `docs/meta-ads.md`. Instagram e Google Analytics continuam com arquitetura preparada (`AdsProvider`/`SocialMediaProvider`) mas sem implementação real.
- **Qualificação automática de ICP**: implementada na etapa anterior — ver seção 8. Uma futura IA de qualificação entraria sugerindo valores para os campos que hoje são preenchidos manualmente (`estimatedRevenue`, `adSpend`, `commercialMaturity`...), sem mudar o motor de cálculo em si.
- **Notificações/e-mail**: `FollowUp` e `Activity` já modelam os eventos que disparariam notificações reais; falta apenas o transporte (e-mail, push).

## 8. Design System Dark Premium e motor de pontuação de ICP

Registrado nesta etapa (pivô visual + qualificação automática de leads).

### 8.1 Paleta dark

Todos os tokens de cor vivem em `src/app/globals.css` (bloco `@theme`). A escala `--color-ink-*` foi **invertida** em relação à fundação original (900 agora é branco = texto principal, 500 é o cinza secundário oficial `#A3A3A3`), e os tons `50/100` das cores de marca e semânticas (`brand`, `success`, `warning`, `danger`) viraram fundos escuros e sutis em vez de tons claros — o padrão usado por chips/badges em qualquer UI dark. Quatro papéis de fundo: `--color-canvas` (#0B0B0B, fundo do app), `--color-well` (#111111, campos de formulário e "trilhos" recuados como o Kanban), `--color-surface` (#171717, cards/modais/tabela) e `--color-surface-subtle`/`-sunken` (#1D1D1D, hover — mais claro que a surface, não mais escuro, ao contrário da convenção light-mode original). Sombra de card foi removida (`--shadow-card: none`) — em dark UI a profundidade vem de borda + contraste de superfície, não de `box-shadow`.

### 8.2 Logo oficial

O arquivo enviado pelo usuário foi localizado no próprio diretório do projeto (não mais um problema de "não consigo salvar imagem colada", como na etapa anterior). Como o PNG original tinha fundo branco sólido, um script one-off (`sharp`, removido após o uso) converteu pixels próximos de branco para transparente e recortou o símbolo (círculos concêntricos) separado do lockup completo, gerando os arquivos em `public/brand/`. O logo em si não foi redesenhado — só teve o fundo removido. `LogoMark`/`Logo`/`LogoFull` (`src/components/brand/logo.tsx`) usam `<img>` simples em vez de `next/image`: o otimizador de imagem do Next apresentou instabilidade com esse PNG específico neste projeto (erro "isn't a valid image"), e para um ícone estático pequeno o `<img>` é mais simples e igualmente correto.

### 8.3 Motor de pontuação de ICP — como funciona

Schema (`prisma/schema.prisma`): `IcpProfile` (um "perfil" de ICP; só um fica `isActive` por organização) → `IcpProfileCriterion` (um dos 11 tipos de `IcpCriterionType`, com `weight` 0-100) → `IcpProfileCriterionRule` (faixas de pontuação 0-100 para aquele critério). `Lead` ganhou os campos que o motor consome (`estimatedRevenue`, `adSpend`, `commercialMaturity`, `marketingNeed`, `technologyNeed`, `recurrencePotential` — todos opcionais) e os campos de resultado (`icpScore`, `priority`, denormalizados para poder ordenar/filtrar sem join). `LeadScore`/`LeadScoreFactor` guardam o resultado mais recente **com o detalhamento por critério**, é o que alimenta a explicação "por que este lead recebeu X pontos?" no detalhe do lead.

Cálculo (`src/server/icp/scoring.ts`, função pura `computeLeadScore`), determinístico, sem IA:
- Critérios **numéricos** (faturamento, ticket, investimento, e as 4 dimensões 0-100): o valor do lead cai na primeira faixa `[minValue, maxValue)` que o contém (limite superior exclusivo, para não haver ambiguidade nas fronteiras); sem faixa correspondente ou sem dado no lead → 0 pontos nesse critério.
- Critérios **categóricos** (segmento, localização): comparação case-insensitive contra `matchValues` de cada faixa.
- **Site/Instagram**: não usam faixas — pontuação cheia se o campo do lead estiver preenchido, 0 caso contrário.
- Score final = média ponderada normalizada: `Σ(peso × pontuação da faixa) / Σ(pesos configurados)`, sempre 0-100 mesmo que os pesos não somem exatamente 100 (o briefing pedia soma normalizada; exigir soma == 100 seria mais frágil para o usuário configurar).
- Classificação fixa: 0-39 BAIXA, 40-69 MÉDIA, 70-84 ALTA, 85-100 MÁXIMA (`classifyScore()` em `src/modules/icp/constants.ts`).

Recalculo (`src/server/icp/recalculate.ts`, `recalculateLeadScore`): roda automaticamente ao **criar ou editar um lead** (dados podem ter mudado) e ao **salvar ou ativar um perfil de ICP** (as regras mudaram — `recalculateAllLeadScores` itera todos os leads da organização). Não é assíncrono/em fila nesta etapa — para o volume de um workspace de agência isso é rápido o suficiente; se o número de leads crescer muito, esse é o primeiro ponto a mover para um job em background.

### 8.4 Armadilha do Prisma `Decimal` em Server → Client Components

Encontrado e corrigido duas vezes nesta etapa: campos `Decimal` do Prisma (`potentialValue`, `estimatedRevenue`, `adSpend` em `Lead`; `minValue`/`maxValue` em `IcpProfileCriterionRule`) são instâncias de classe, não objetos planos — o React rejeita passá-los de um Server Component para um Client Component ("Only plain objects can be passed..."). A correção fica na camada de serviço, não nos componentes: `lead.service.ts` e `icp.service.ts` serializam (`Number(...)`) esses campos antes de retornar, e os tipos exportados (`LeadWithRelations`, `IcpProfileForClient`) refletem isso — se um novo campo `Decimal` for adicionado ao schema no futuro, ele precisa do mesmo tratamento em qualquer função cujo retorno alimente um Client Component.

### 8.5 Armadilha do `proxy.ts` bloqueando assets públicos

O matcher original excluía apenas `_next/*`, `favicon.ico` e `icon` — qualquer outro arquivo estático em `public/` (como `/brand/logo-full.png`) era tratado como rota protegida e redirecionado para `/login` quando não autenticado, quebrando o logo na própria tela de login. Corrigido excluindo qualquer caminho terminado em extensão de arquivo (`.*\.[^/]+$`) do matcher, além das rotas de auth e internals do Next.

## 9. Encontrar Leads — busca externa, deduplicação e enriquecimento

Registrado nesta etapa. Objetivo: preparar o CRM para receber leads de fontes externas com segurança, sem implementar nenhuma fonte real ainda.

### 9.1 Arquitetura da fonte de leads (`src/server/lead-sourcing/`)

```
Google Places / fonte externa (futuro)
  -> SearchProvider (types.ts) — interface: searchBusinesses() / getBusinessDetails()
  -> provider.ts — getActiveLeadSourceProvider(), hoje sempre devolve o mock
  -> normalize.ts — padroniza telefone/site/e-mail/cidade/estado/nome
  -> findDuplicateLead() (server/leads/lead.service.ts, reaproveitado — não duplicado)
  -> computeLeadScore() (server/icp/scoring.ts, reaproveitado — não duplicado)
  -> LeadSearchQuery + LeadSearchResult (auditoria + snapshot pontuado)
  -> "Adicionar ao CRM" -> createLead() (reaproveitado) + LeadEnrichment
```

`mock-provider.ts` implementa `SearchProvider` com 32 empresas fictícias (variando segmento, cidade, presença digital e completude de dados) — é o único provider registrado em `provider.ts` porque nenhuma credencial de fonte externa está configurada (`GOOGLE_MAPS_API_KEY` seguiria em `.env.example`, ainda não lida pelo app). Trocar por uma fonte real no futuro é implementar `SearchProvider` e apontar `getActiveLeadSourceProvider()` para ela; `search.service.ts`, as actions e a UI não mudam.

### 9.2 Reaproveitamento do motor de ICP para leads ainda não salvos

`computeLeadScore` (seção 8.3) aceitava um `Lead` do Prisma. Para pontuar um resultado de busca — que ainda não é um `Lead` — a assinatura foi generalizada para `ScorableLeadInput`, uma interface só com os campos que o motor realmente lê (website, instagram, segmento, estado, faturamento, ticket, investimento, as 4 dimensões 0-100). Um `Lead` do Prisma satisfaz essa interface estruturalmente, então nenhum call site existente mudou — a mesma função pontua leads reais e candidatos de busca, sem duplicar a lógica de scoring.

### 9.3 Deduplicação

`findDuplicateLead` (`server/leads/lead.service.ts`, já usado pela importação de CSV) é reaproveitado tanto no momento da busca (marca cada resultado como `NEW` ou `DUPLICATE`, com `matchedLeadId`) quanto no momento de "Adicionar ao CRM" (reconfere — defesa contra corrida entre a busca e a confirmação). Casa por CNPJ, site, telefone ou e-mail; sem correspondência clara, não duplica.

### 9.4 Enriquecimento e auditoria

`LeadEnrichment` guarda, por lead e por campo (`EnrichmentField`: site, Instagram, LinkedIn, telefone, e-mail, segmento, cidade, estado, funcionários, faturamento estimado, atividade de anúncios, presença digital, stack de tecnologia), um status `FOUND`/`NOT_FOUND`/`PENDING` e a fonte. Criado em `buildEnrichmentRecords` (`enrichment.ts`) a partir exatamente do que o provider devolveu — campo ausente vira `NOT_FOUND`, nunca um valor inventado. `LeadSearchQuery` registra cada execução de busca (fonte, termo, cidade, segmento, usuário, quantidade encontrada/adicionada/duplicada) para auditoria; `LeadSearchResult` guarda o snapshot pontuado de cada empresa candidata (incluindo `scoreFactors` em JSON, para poder mostrar "por que este lead recebeu X pontos?" antes mesmo de ele virar um `Lead`).

### 9.5 Rotas e origem no CRM

Nenhuma rota nova — `/encontrar-leads` foi reconstruída. Leads importados entram no pipeline em `NOVOS` com `source = BUSCA_EXTERNA` ("Fonte Externa") — um valor novo em `LeadSource`, deliberadamente distinto de `GOOGLE_MAPS` (reservado para quando uma integração real existir) para não rotular dados do provider mock como se viessem do Google.

### 9.6 Ajustes da revisão seguinte

- Ordenação de resultados ganhou a opção "Potencial" (por `potentialValue`), além de ICP Score/Prioridade/Empresa.
- O import (`importLeadSearchResults`) agora também registra uma `Activity` explícita "Lead importado da fonte de aquisição." em cada lead criado — além da atividade genérica "Lead X criado" que `createLead()` já grava para qualquer fluxo (manual, CSV, busca).
- Os indicadores de "Aquisição de Leads" no Dashboard (`stats.service.ts`) passaram a ser sempre do dia corrente (`createdAt >= hoje 00:00`) — antes eram acumulados desde sempre. Sem coluna "taxa de aproveitamento" nesta versão do widget.

## 10. Tema Claro/Escuro

Registrado nesta etapa. O sistema já era 100% orientado a tokens (`@theme` em `globals.css`) — nenhum componente tinha cor fixa, com uma exceção encontrada e corrigida (ver 10.3) — então o suporte a dois temas não exigiu tocar em componente nenhum além disso: só um segundo conjunto de valores para as mesmas custom properties.

### 10.1 Como a troca funciona (sem biblioteca externa)

`<html data-theme="light">` (ou sem o atributo, que é o padrão = escuro) é a única chave. Em `globals.css`, o bloco `@theme` original define a paleta escura em `:root`; um segundo bloco `:root[data-theme="light"]` redefine as MESMAS custom properties (`--color-canvas`, `--color-ink-*`, `--color-brand-50..400`, etc.) com os valores do tema claro. Como todo utilitário Tailwind já compila para `var(--color-*)`, mudar o atributo no `<html>` já basta — é troca de CSS puro, sem re-render de React.

- **Persistência**: cookie `luvi_theme` (não httpOnly — ver 10.2), gravado diretamente pelo cliente via `document.cookie` (`components/theme/use-theme.ts`) e lido no servidor por `server/theme/theme.service.ts`, usado pelo `RootLayout` (`app/layout.tsx`) para renderizar `<html data-theme="...">` já correto na primeira resposta HTML — sem flash de tema errado, sem script bloqueante no `<head>`.
- **Leitura reativa**: `useTheme()` (hook único, reaproveitado pelo botão do Header e pela seção "Aparência" em Configurações — nenhuma lógica duplicada) usa `useSyncExternalStore` sobre o atributo `data-theme`, com um `MutationObserver` como `subscribe`. Isso resolve dois problemas de uma vez: (a) `getServerSnapshot` evita mismatch de hidratação (servidor não conhece `document`), e (b) múltiplas instâncias do toggle montadas ao mesmo tempo (Header + Configurações, já que o Header aparece em toda página do dashboard) ficam sincronizadas automaticamente — clicar em "Escuro" nas Configurações atualiza o ícone do Header no mesmo instante, sem prop drilling nem contexto React.
- **Transição visual**: regra global de baixíssima especificidade (seletor `*`, propósito: nunca vencer um `transition-*` mais específico do Tailwind) aplicando `transition: background-color, border-color, color, fill, stroke 150ms`, dentro de `@media (prefers-reduced-motion: no-preference)`.

### 10.2 Por que o cookie é gravado no cliente, não por Server Action

Primeira implementação usava uma Server Action (`"use server"`) para persistir o cookie — parecia mais "correto" no padrão do resto do app (que já usa Server Actions em tudo). Só que isso é assíncrono e **sem relação de ordem** com qualquer outra navegação que o usuário dispare logo em seguida: no teste manual, trocar o tema na tela de login e imediatamente logar (`router.refresh()` do fluxo de login) às vezes corria na frente da Server Action — o refresh lia o cookie ainda com o valor antigo no servidor e revertia o tema visualmente. Trocado para uma escrita síncrona em `document.cookie` (no clique, antes de qualquer outro handler poder rodar) — elimina a corrida por construção, e é o padrão usado por praticamente toda implementação de dark mode em SSR (é o que `next-themes` faz por baixo dos panos). O cookie não precisa ser httpOnly: não guarda nada sensível, só precisa ser lido pelo `RootLayout` no servidor, e qualquer cookie não-httpOnly já é enviado em toda requisição normalmente.

### 10.3 Paleta clara — não é o escuro invertido

Valores exatos em `globals.css`, bloco `:root[data-theme="light"]`. Fundo `#F7F7F7`, superfície `#FFFFFF`, superfície secundária (campos/trilho do Kanban) `#F2F2F2`, texto principal `#111111`, texto secundário `#666666`, borda `#E5E5E5` (borda "forte" de inputs um pouco mais escura, `#D4D4D4`, para manter affordance em fundo branco). Decisões que exigiram recalcular em vez de inverter:

- **Escala de texto (`ink-50..950`)**: recriada do zero para ficar legível em fundo claro — não é `1 - valor_escuro`.
- **Chips de marca (`brand-50/100` fundo, `brand-400` texto — usados em `Badge variant="brand"`, `Avatar`, cards de destaque)**: no escuro, fundo escuro + texto claro vibrante. No claro, fundo teria que ficar bem claro (pêssego pálido) e o texto bem mais escuro/saturado para ter contraste em branco — se só invertesse os mesmos tons, o texto ficaria claro demais sobre um fundo já claro. `brand-500` (`#FF3B00`, cor de destaque oficial) permanece idêntica nos dois temas por pedido explícito do briefing.
- **Cores semânticas (`success/warning/danger/info`)**: os tons "500/600" do escuro são vibrantes o bastante para contrastar num fundo quase preto, mas praticamente ilegíveis em branco (`warning-500` do escuro, por exemplo, é um amarelo puro — falha contraste em fundo claro). Recalculados como tons mais escuros/densos (ex: `warning-500` vira um âmbar escurecido) que funcionam tanto em texto direto sobre branco quanto sobre o próprio chip pastel `-50`.
- **Sombra**: no escuro, profundidade vem só de borda (`--shadow-card: none`). No claro, borda sozinha não separa bem um card branco de um fundo quase-branco — `--shadow-card` voltou a ter uma sombra real e sutil.

### 10.4 Cores hardcoded encontradas e corrigidas

Auditoria (`grep` por `text-white`/`bg-white`/hex literal fora de `globals.css`) encontrou três ocorrências de `text-white` fixo em elementos que vivem sobre o fundo da sidebar (`chrome-bg`): o item ativo/hover do menu (`sidebar-nav.tsx`), o botão de fechar do menu mobile (`mobile-sidebar.tsx`) e a wordmark "LUVI" (`brand/logo.tsx`). Branco fixo é invisível no tema claro, onde a sidebar também fica clara — trocado por `text-chrome-fg` (token que já existia e resolve corretamente nos dois temas). Fora esses três pontos, o app já não tinha nenhuma cor fora do sistema de tokens.

## 11. Google Places API (New) — primeira fonte real de leads

Registrado nesta etapa. `SearchProvider` (seção 9) ganhou sua primeira implementação real, ao lado do mock — nenhuma página ou serviço interno foi acoplado diretamente ao Google.

### 11.1 Estrutura (`src/server/lead-sourcing/google-places/`)

```
config.ts    — única porta de leitura de GOOGLE_MAPS_API_KEY (nunca lida em outro lugar)
errors.ts    — GooglePlacesError + mapeamento status HTTP/Google -> mensagem amigável em pt-BR
client.ts    — único fetch real à Places API: header X-Goog-Api-Key, timeout de 10s, nunca loga a chave
fields.ts    — FieldMask centralizado (item 9: "não espalhar FieldMask pelo projeto") — dois conjuntos, ver 11.2
normalize.ts — JSON cru do Google -> ProviderBusiness; parseCityStateFromAddress() extrai cidade/UF de formattedAddress
search.ts    — buildTextQuery() + searchTextPlaces() (Text Search, paginado)
details.ts   — getPlaceDetails() (Place Details — GooglePlacesDetailsService do briefing)
provider.ts  — googlePlacesProvider: SearchProvider
test-connection.ts — usado só pelo botão "Testar conexão" em /configuracoes/integracoes
```

`server/lead-sourcing/provider.ts` (`getActiveLeadSourceProvider`) escolhe Google sempre que `isGooglePlacesConfigured()` é verdadeiro; sem a chave, cai para o mock automaticamente — nunca quebra o app (item 26). `getLeadSourceProviderById(id)` existe à parte porque o enriquecimento (11.4) precisa reconsultar com o MESMO provider que gerou o resultado, mesmo que a configuração ativa tenha mudado depois.

### 11.2 Dois FieldMasks, dois custos

- **Busca (Text Search)** — `places.id, places.displayName, places.formattedAddress, places.location, places.primaryType, places.types, nextPageToken`. Só identificação; nenhum campo de contato/avaliação é pedido aqui, de propósito (item 5/9 — controle de custo). `nextPageToken` é técnico (paginação), não é dado de negócio, mas precisa estar no FieldMask ou o Google simplesmente não devolve o token.
- **Detalhes (Place Details)** — `id, nationalPhoneNumber, internationalPhoneNumber, websiteUri, googleMapsUri, rating, userRatingCount`. Só chamado por resultado, sob demanda (botão "Enriquecer") — nunca automaticamente para todos os resultados de uma busca.

Consulta em texto livre (`buildTextQuery`, item 6): `"{segmento} {palavra-chave} em {cidade}, {UF}"` — omite o que não foi informado; sem segmento/palavra-chave, cai em "empresas" como assunto genérico.

### 11.3 Paginação sem loop infinito

`searchTextPlaces` pagina via `nextPageToken` (`maxResultCount` máximo de 20 por página), mas com duas travas duras independentes da quantidade pedida: no máximo 3 páginas (`MAX_PAGES`) e para de pedir mais assim que atinge a quantidade solicitada pelo usuário. A quantidade em si já é limitada a 10/20/30/50 na UI (`SEARCH_QUANTITY_OPTIONS`, `schema.ts`) — 3 páginas sempre cobre o teto de 50. Uma pequena pausa (300ms) antes de reusar um `pageToken` evita erro de token "ainda não pronto".

### 11.4 Enriquecimento sob demanda e reaproveitamento do ICP

A interface `SearchProvider.getBusinessDetails` (seção 9) mudou de "devolve um `ProviderBusiness` completo" para "devolve só os campos que conseguiu, ou `null`" (`Partial<ProviderBusiness> | null`) — o mock continua compatível (um objeto completo é um `Partial` válido). `enrichLeadSearchResult` (`search.service.ts`) faz o merge (só sobrescreve com valor não-nulo, nunca apaga o que já existia) e **recalcula o ICP Score** — o site pode ter passado de "não encontrado" para um valor real, o que muda o critério SITE. Esse recálculo usa `scoreBusiness()` (`score-business.ts`), extraído nesta etapa para ser a única ponte entre `ProviderBusiness` e `computeLeadScore` — antes a mesma lógica de montar o `ScorableLeadInput` estava só dentro de `runLeadSearch`; agora busca inicial e enriquecimento chamam a mesma função, sem duplicar.

### 11.5 Nunca inventar — o modelo FOUND/NOT_FOUND continua sendo a resposta

Um lead recém-saído do Google só tem `company`, `type` (bruto, ex: "dentist"), `address`/`city`/`state` (quando o endereço dá para interpretar com confiança) e `segment` = o termo que o usuário buscou (não um dado do Google — ver nota em `normalize.ts`: a taxonomia `primaryType` do Google, em inglês, não bate com o vocabulário de segmento configurado no ICP, então usar o termo buscado é o que mantém o critério SEGMENTO funcional). Telefone/site/avaliação só existem depois do "Enriquecer". `estimatedRevenue`, `adSpend`, `commercialMaturity` e as outras dimensões usadas pelo ICP **nunca** vêm do Google — continuam null até alguém preencher manualmente no lead já importado. Isso é esperado e correto (item 13): um ICP Score de um lead do Google recém-chegado tende a ser baixo-a-médio, pontuando basicamente por Segmento/Localização/Site, até o vendedor complementar os dados.

### 11.6 Erros, sem nunca expor a chave

`GooglePlacesError` sempre carrega uma mensagem pronta pt-BR (`errors.ts`); o corpo cru da resposta do Google só é logado no servidor (`console.error`, nunca devolvido ao cliente). Mapeamento: 401/`UNAUTHENTICATED` → chave inválida; 403/`PERMISSION_DENIED` → API não habilitada ou faturamento desligado; 429/`RESOURCE_EXHAUSTED` → limite de requisições; 5xx → indisponibilidade; timeout (`AbortController`, 10s) → mensagem própria. Chave ausente é checada ANTES de qualquer fetch (`client.ts`), com a mensagem exata pedida no briefing. As Server Actions (`actions.ts`) capturam `GooglePlacesError` e devolvem `{ok:false, error: mensagem}` — nunca deixam o erro genérico do Next vazar.

### 11.7 Rate limit do enriquecimento

Sem fila/worker: o botão "Enriquecer" é por resultado (não existe "enriquecer todos"), e cada linha desabilita o próprio botão enquanto a chamada está em andamento. Como cada clique é uma ação humana isolada, isso já satisfaz "não disparar dezenas de chamadas simultâneas" sem precisar de infraestrutura de fila — não há como o usuário disparar mais de uma chamada de enriquecimento por vez pela própria UI.

### 11.8 Banco

Migração aditiva (`20260903173848_google_places`): `LeadSource` ganhou `GOOGLE_PLACES` (distinto de `GOOGLE_MAPS`, que já existia como tag manual/genérica — importar via Google Places de verdade não deveria ser confundido com um lead só rotulado manualmente); `EnrichmentField` ganhou `RATING`/`USER_RATING_COUNT`; `LeadSearchResult` ganhou `type`, `address`, `sourceUrl`, `rating`, `userRatingCount` (o resto de campos específicos do Google que não mereciam coluna própria continuam em `raw`, que aqui cumpre o papel de "sourceMetadata" do briefing); `Lead` ganhou `externalId` (placeId) e `sourceUrl` (link do Google Maps), com índice `[organizationId, externalId]` para a deduplicação por placeId (`findDuplicateLead` agora aceita `externalId` além de CNPJ/site/telefone/e-mail).

### 11.9 Configuração e teste de conexão

`/configuracoes/integracoes` mostra "Configurado"/"Não configurado" (nunca a chave em si — nem parcial) e um botão "Testar conexão" que roda uma única Text Search controlada (`maxResultCount: 1`, "empresas em São Paulo") sem gravar nada no banco — não é uma busca de verdade, só uma checagem de credenciais/conectividade.
