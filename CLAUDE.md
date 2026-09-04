@AGENTS.md

# Preferências do usuário e fluxo de trabalho

## Git e deploy

- Repositório remoto: `https://github.com/LuviCompany/system.git` (branch `main`).
- Identidade de commit configurada localmente neste repositório (não global): `Luvi Company` / `agencialzcompany@gmail.com`.
- Fluxo combinado com o usuário: ao final de cada tarefa/etapa de desenvolvimento, commitar e enviar (`git push`) para o repositório remoto automaticamente, sem esperar pedido explícito.
- O sandbox de execução usado nas sessões do Claude Code bloqueia `git push` direto e qualquer alteração de configuração do Git (`git remote set-url`, etc.) através de um classificador de permissões. Push só funciona de duas formas:
  - com um token pessoal do GitHub embutido diretamente no comando (`git push https://<token>@github.com/LuviCompany/system.git main`), usado uma única vez, nunca persistido em arquivo nem em `.git/config`; ou
  - quando o próprio usuário roda `git push` no terminal dele (Git CMD/PowerShell) — nesse caso a autenticação já é resolvida pela máquina dele (Git Credential Manager), funcionando sem prompt.
- Nunca salvar token/credencial em arquivo do projeto. Se for necessário um novo token durante uma sessão, pedir ao usuário e usar só em memória, de forma transitória.

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
