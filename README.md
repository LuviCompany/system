# LUVI CRM

> "Transforme prospecção em resultado."

CRM interno da **Luvi Company** para o time comercial prospectar, qualificar e acompanhar leads — leads, pipeline Kanban, atividades, follow-ups, ICP e importação de leads via CSV.

> **Nota histórica:** o projeto começou como "LUVI Intelligence" (dashboard de métricas de mídia paga dos clientes da agência). Ele pivotou para "LUVI CRM" — uma ferramenta de vendas para a própria operação comercial da Luvi. Ver [ARCHITECTURE.md](ARCHITECTURE.md) para o racional completo.

**Nenhuma integração externa real está conectada ainda** (Google Maps, scraping, IA de qualificação, etc. — arquitetura preparada, não implementada).

---

## Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | full-stack em TypeScript, Server Components e Server Actions cobrem o backend sem um serviço separado nesta fase |
| Linguagem | TypeScript (strict) | segurança de tipos ponta a ponta |
| Estilo | Tailwind CSS v4 + tokens próprios (`@theme`) | design system centralizado, cor de marca (`#FF3B00`) trocável em um único lugar |
| Componentes base | Radix UI + `class-variance-authority` | acessibilidade (foco, teclado, ARIA) pronta, estilo 100% LUVI |
| Kanban / drag-and-drop | `@dnd-kit` | biblioteca madura, acessível, sem dependência de HTML5 D&D nativo (mais confiável em mobile) |
| Gráficos | Recharts | funil comercial e leads por etapa no dashboard |
| CSV | `papaparse` | parser isomórfico (roda igual no preview do navegador e na importação no servidor) |
| Banco de dados | PostgreSQL | relacional, robusto, adequado ao modelo multi-tenant |
| ORM | Prisma 6 (estável) | migrations declarativas; evitei o Prisma 7 por exigir `prisma.config.ts` + driver adapter, complexidade desnecessária nesta fase |
| Autenticação | Sessão própria (JWT via `jose` em cookie `httpOnly`) + `bcryptjs` | controle total do modelo de sessão multi-tenant/multi-papel, sem depender de uma lib de auth ainda instável para o App Router |
| Validação | Zod | usado em todo formulário e Server Action |

---

## Instalação

Pré-requisitos: **Node.js 20+** e **PostgreSQL 14+** (rodando localmente ou acessível pela `DATABASE_URL`).

```bash
npm install
cp .env.example .env
```

Preencha `.env`:

- `DATABASE_URL`: string de conexão do seu Postgres, ex. `postgresql://postgres:SUA_SENHA@localhost:5432/luvi_crm?schema=public`
- `AUTH_SECRET`: gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Rodando o projeto

```bash
npm run db:migrate   # aplica o schema Prisma ao banco (cria as tabelas)
npm run db:seed      # cria a organização, os usuários de dev e ~22 leads de demonstração
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) — redireciona para `/login`.

### Usuários de desenvolvimento (criados pelo seed)

Todos com a mesma senha: **`Luvi@2026`**

| Papel | E-mail |
|---|---|
| ADMIN | `admin@luvicompany.com` |
| GESTOR | `gestor@luvicompany.com` |
| VENDEDOR | `vendedor@luvicompany.com` |

> Troque essas credenciais antes de qualquer uso além do ambiente local de desenvolvimento.

### Outros comandos

```bash
npm run db:push     # sincroniza o schema sem gerar arquivo de migração (prototipagem rápida)
npm run db:studio   # interface visual para inspecionar o banco
npm run build       # build de produção
npm run start       # roda o build de produção
npm run lint        # ESLint
```

---

## Estrutura do projeto

```
src/
  app/
    (dashboard)/            # rotas autenticadas — sidebar + header
      dashboard/  leads/  pipeline/  atividades/  follow-ups/
      icp/  qualificacao/  relatorios/
      importar-leads/  encontrar-leads/
      equipe/  configuracoes/
    login/
    api/auth/                # login, logout
  components/
    ui/                      # Design System LUVI (Button, Drawer, Modal, DataTable, Checkbox...)
    layout/                  # Sidebar (com seções), Header, menu mobile
    brand/                   # Logo (wordmark — ver nota sobre o arquivo oficial abaixo)
    leads/ pipeline/ followups/ icp/ team/ import/ org/ dashboard/
  modules/
    leads/                   # tipos, constantes (etapas, origens, tags) e parser de CSV — puro, sem I/O
    team/                    # rótulos e opções de papel (ADMIN/GESTOR/VENDEDOR)
  server/                    # código que só roda no servidor
    auth/                    # sessão, hashing de senha, serviço de login, requireSession/requireRole
    leads/ activities/ followups/ icp/ tags/ team/ org/ dashboard/
      *.service.ts           # regras de negócio + Prisma
      actions.ts              # Server Actions ("use server") chamadas pelos componentes client
    db/                      # cliente Prisma singleton
  proxy.ts                   # proteção de rotas (equivalente ao antigo "middleware")
prisma/
  schema.prisma              # modelo multi-tenant centrado em Lead
  seed.ts                    # organização + 3 usuários + tags + ICP + 22 leads de demonstração
```

---

## Arquitetura, multi-tenant e decisões de produto

Ver [`ARCHITECTURE.md`](ARCHITECTURE.md) para: modelo multi-tenant e papéis (ADMIN/GESTOR/VENDEDOR), como a autenticação protege as rotas, decisões registradas onde o briefing era ambíguo (ex: como "Leads qualificados" é calculado, por que o Prisma 7 foi evitado, o que aconteceu com o logo oficial).

## Sobre o logo oficial

O logo oficial da Luvi (arquivo fornecido pelo usuário no diretório do projeto) está aplicado em `public/brand/` — fundo branco removido programaticamente, símbolo e lockup completo recortados separadamente. `src/components/brand/logo.tsx` é o único lugar que referencia esses arquivos (sidebar, header, login, favicon/app icon); qualquer ajuste de arquivo de logo é feito só ali.

## Design System

Tema dark premium (preto/grafite + laranja `#FF3B00` como única cor de marca), tokens centralizados em `src/app/globals.css`. Ver seção 8 de [`ARCHITECTURE.md`](ARCHITECTURE.md) para a paleta completa e as decisões de contraste.

## Tema Claro/Escuro

O botão no Header (e a seção "Aparência" em Configurações) alterna entre os dois temas — a preferência persiste em cookie e sobrevive a atualizar a página, fechar o navegador e navegar entre telas. Nenhuma biblioteca externa: a troca é só um atributo `data-theme` no `<html>` mais um segundo bloco de tokens em `globals.css` (o tema claro não é o escuro invertido — paleta recalculada para contraste). Ver seção 10 de [`ARCHITECTURE.md`](ARCHITECTURE.md).

## ICP e pontuação automática de leads

`/icp` permite configurar um ou mais perfis de ICP (11 critérios com peso 0-100 cada e faixas de pontuação por critério). O perfil ativo pontua automaticamente todos os leads (0-100, classificado em Baixa/Média/Alta/Máxima prioridade) sempre que um lead é criado/editado ou o perfil é salvo/ativado — determinístico, sem IA. O detalhe de cada lead mostra a explicação "por que este lead recebeu X pontos?" com a contribuição de cada critério. Ver seção 8.3 de [`ARCHITECTURE.md`](ARCHITECTURE.md) para o algoritmo completo.

## Encontrar Leads (Google Places API)

`/encontrar-leads` busca empresas reais por segmento/cidade/estado/palavra-chave via **Google Places API (New)** — Text Search para a busca inicial (dados de identificação, campo mínimo) e Place Details sob demanda (botão "Enriquecer") para telefone/site/avaliação, controlando custo. Sem `GOOGLE_MAPS_API_KEY` configurada, cai automaticamente para um provider mock (32 empresas fictícias) em modo demonstração — nunca quebra o app. Cada resultado é normalizado, verificado contra leads já existentes (placeId/CNPJ/site/telefone) e pontuado pelo mesmo motor de ICP usado pelos leads reais. Configure e teste a chave em Configurações → Integrações. Ver seções 9 e 11 de [`ARCHITECTURE.md`](ARCHITECTURE.md) para a arquitetura completa (interface `SearchProvider`, FieldMask, deduplicação, auditoria).

## Variáveis de ambiente

Veja [`.env.example`](.env.example). `DATABASE_URL` e `AUTH_SECRET` são obrigatórias para rodar o app (login e todas as páginas dependem do banco agora, diferente da fase anterior). Nunca commite `.env`.

## O que **não** está implementado (por decisão de escopo)

- Scraping de qualquer tipo — a única fonte externa real é a API oficial do Google Places (New).
- IA de qualificação, Meta/Instagram API, WhatsApp, Google Ads API, Nuvemshop, billing, pagamentos, e-mail transacional real.
- Testes automatizados (unitários/E2E) — não havia suíte configurada; a validação desta etapa foi lint + typecheck + build + testes manuais no navegador.
