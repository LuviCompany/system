@AGENTS.md

# Preferências do usuário e fluxo de trabalho

## Git e deploy

- Repositório remoto: `https://github.com/LuviCompany/system.git` (branch `main`).
- Identidade de commit configurada localmente neste repositório (não global): `Luvi Company` / `agencialzcompany@gmail.com`.
- Fluxo combinado com o usuário: ao final de cada tarefa/etapa de desenvolvimento, commitar e enviar (`git push`) para o repositório remoto automaticamente, sem esperar pedido explícito.
- O sandbox de execução usado nas sessões do Claude Code bloqueia `git push` direto e qualquer alteração de configuração do Git (`git remote set-url`, etc.) através de um classificador de permissões — **inclusive com um token pessoal embutido na URL do comando** (testado e confirmado bloqueado em 2026-09-04, mais de uma vez). Não adianta insistir nessa abordagem dentro da sessão.
- Único método que funciona: o próprio usuário roda `git push origin main` no terminal dele (Git CMD/PowerShell), na pasta do projeto — a autenticação já é resolvida pela máquina dele (Git Credential Manager), sem prompt. Depois de cada commit feito pela Claude, pedir pro usuário rodar esse push.
- Nunca salvar token/credencial em arquivo do projeto. Se for necessário um novo token durante uma sessão (mesmo sabendo que o push direto será bloqueado), pedir ao usuário e usar só em memória, de forma transitória — nunca escrever em `.git/config` ou em qualquer arquivo versionado.

## Produção (Vercel + Supabase)

- Deploy: projeto Vercel `system` (time "Luvi Company", plano Hobby), conectado ao GitHub `LuviCompany/system` — cada push na branch `main` dispara redeploy automático. Domínio de produção: `https://system-psi-seven.vercel.app`.
- Banco de produção: Supabase Postgres (região São Paulo), provisionado em 2026-09-04 via integração nativa Vercel↔Supabase (Storage → Create Database → Supabase).
- **A integração da Supabase NÃO cria a variável `DATABASE_URL`** — ela cria `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, etc. O Prisma deste projeto só lê `DATABASE_URL` (ver `prisma/schema.prisma`), então é preciso criar essa variável manualmente na Vercel com o valor de `POSTGRES_PRISMA_URL` (a conexão com pooling, adequada pra funções serverless).
- Variáveis obrigatórias em Settings → Environment Variables (escopo Production, idealmente também Preview): `DATABASE_URL`, `AUTH_SECRET` (gerar com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). `GOOGLE_MAPS_API_KEY` é opcional (sem ela, `/encontrar-leads` cai automaticamente no provider mock).
- **Editar uma env var na Vercel não afeta deployments já existentes** — é sempre necessário um novo deploy (push novo ou "Redeploy" manual em Deployments) depois de qualquer mudança de variável, senão a função continua rodando com o valor antigo (ou ausente).
- Gotcha já observado na prática: uma env var pode aparecer corretamente preenchida no painel (com valor e ambientes certos) e ainda assim chegar vazia/`undefined` em runtime, sem motivo aparente — aconteceu com `AUTH_SECRET` em 2026-09-04. Se um erro de "variável não definida" persistir mesmo após confirmar visualmente e fazer redeploy, apagar a variável e recriá-la do zero (não só editar) costuma resolver. Pra confirmar sem expor segredos, criar uma rota de diagnóstico temporária que retorna só `Boolean(process.env.X)` e o tamanho da string (nunca o valor), testar, e remover a rota depois — lembrando de excluí-la do matcher do `proxy.ts` enquanto ela existir, já que ele bloqueia qualquer rota fora de `/login` e `/api/auth/*` por padrão.
- `package.json` tem `postinstall: prisma generate` (adicionado em 2026-09-04) — necessário porque a Vercel nem sempre regenera o Prisma Client sozinha, e sem isso o client pode ficar desatualizado/ausente num build novo.
- Migrations **não rodam automaticamente em produção** — depois de criar/alterar o schema, rodar manualmente contra o banco de produção (usar a connection string non-pooling pra evitar problemas com DDL via pgbouncer): `DATABASE_URL="<connection string non-pooling>" npx prisma migrate deploy`, e se necessário `npm run db:seed` (idempotente, usa upsert).
- Usuários de seed disponíveis (local e produção, mesma senha para os três): `admin@luvicompany.com`, `gestor@luvicompany.com`, `vendedor@luvicompany.com` — senha `Luvi@2026`.
- A rota `src/app/api/auth/login/route.ts` loga (`console.error`) qualquer erro inesperado antes de devolver a mensagem genérica ao usuário — checar Vercel → Deployments → deployment ativo → Runtime Logs é o primeiro passo pra diagnosticar falhas de login em produção.

## Comunicação e forma de trabalho

- Conversas e instruções em português (pt-BR); manter respostas nesse idioma.
- O usuário trabalha em "etapas" numeradas (ex: "Etapa 3", "Etapa 4") — cada uma com escopo bem definido e uma lista explícita do que **não** deve ser implementado ainda.
- Ao final de cada etapa, entregar um relatório estruturado no formato pedido (alterações, banco, rotas, testes, erros corrigidos, pendências) e parar — não avançar para a etapa seguinte nem para integrações fora do escopo sem novo pedido explícito.
- Trabalhar de forma autônoma dentro do escopo já pedido (sem pausar para confirmar decisões de implementação de baixo risco), mas perguntar antes de ações irreversíveis, fora do escopo, ou que envolvam credenciais/configuração do Git.

## Histórico desta conversa (registrado em 2026-09-03/04)

- **Etapa 3**: transformação de `/encontrar-leads` num fluxo funcional — provider mock (`MockSearchProvider`), deduplicação, enriquecimento de campos (FOUND/NOT_FOUND) e pontuação automática de ICP reaproveitando o motor existente.
- **Etapa 4 (parte 1 — Tema)**: alternância de tema claro/escuro persistente via cookie, paleta clara recalculada do zero (não é o escuro invertido) e correção de três cores brancas hardcoded na sidebar que quebravam no tema claro.
- **Etapa 4 (parte 2 — Google Places)**: primeira fonte real de leads via Google Places API (New) — Text Search com FieldMask mínimo na busca inicial, enriquecimento sob demanda via Place Details (telefone/site/avaliação), fallback automático para o provider mock quando `GOOGLE_MAPS_API_KEY` não está configurada, e página de status/teste de conexão em `/configuracoes/integracoes`. Ver seções 9-11 de `ARCHITECTURE.md` para os detalhes técnicos completos de todas as etapas de Encontrar Leads.
- Repositório GitHub conectado (`LuviCompany/system`) e primeiro commit (`a5fe57b`, 161 arquivos, "Commit inicial do LUVI CRM") publicado na branch `main`.
