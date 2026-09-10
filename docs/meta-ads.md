# Integração Meta Ads (etapa 7)

Integração real, somente leitura (`ads_read`, sem `ads_management`), com a
Meta Marketing API via Facebook Login. Não cria, edita, pausa nem exclui
nada na Meta — só lê contas de anúncio, campanhas, anúncios e métricas e
guarda uma cópia normalizada no banco do LUVI. Instagram tem a arquitetura
preparada (`src/server/integrations/meta/instagram/`), mas **não é
implementado nesta etapa** — nenhuma permissão de Instagram é solicitada.

## Arquitetura

```
src/server/integrations/
  ads-provider.ts          # contrato genérico (Google/Meta implementam isso)
  meta/
    config.ts              # env vars + escopos OAuth (só ads_read nesta etapa)
    errors.ts              # MetaError + mapMetaGraphError (envelope único da Graph API)
    oauth.ts                # authUrl, exchangeCodeForTokens, refresh (re-troca), revoke
    state.ts                 # assina/verifica o `state` do OAuth (JWT curto)
    connection.service.ts    # CRUD da conexão (ClientPlatform), token sempre criptografado
    sync.ts                   # orquestra fetch + normalização + upsert no Postgres
    actions.ts                 # server actions (listar contas, selecionar, sincronizar, desconectar)
    ads/
      client.ts                # HTTP client de baixo nível da Graph API
      reporting.ts              # chamadas de Insights (somente leitura)
      normalization.ts           # formato bruto -> modelo interno
      provider.ts                 # MetaAdsProvider implements AdsProvider
    instagram/                    # arquitetura preparada, sem implementação real
```

## 1. Configuração no Meta for Developers

1. Crie um app em https://developers.facebook.com/apps — tipo "Empresa"
2. Adicione o produto **Facebook Login for Business**
3. Em Configurações → Básico: copie o **App ID** e o **App Secret**
4. No produto Facebook Login: cadastre a **URI de redirecionamento OAuth
   válida** — a mesma que vai em `META_REDIRECT_URI` (ver seção 2)
5. Em Revisão do App → Permissões: solicite `ads_read` para uso além de
   admins/testers do app. **Isso exige Business Verification** (processo
   externo da Meta, pode levar dias) — sem isso, só contas de anúncio do
   próprio usuário que criou o app (admin/tester) conseguem autorizar

## 2. Variáveis de ambiente

```
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=http://localhost:3000/api/integrations/meta/callback

# Compartilhada com Google Ads — mesma criptografia de tokens em repouso:
TOKEN_ENCRYPTION_KEY=
```

Em produção, `META_REDIRECT_URI` precisa ser a URL pública do domínio e
precisa estar cadastrada como "URI de redirecionamento OAuth válida" no
produto Facebook Login do app.

## 3. Como funciona o token (diferente do Google)

A Meta **não tem refresh token separado**:

1. `code` do callback → token de curta duração (~1-2h)
2. Trocado automaticamente por um token de **longa duração** (~60 dias) via
   `grant_type=fb_exchange_token`
3. Antes de expirar, `getValidAccessToken()` repete essa mesma troca
   usando o token atual — isso "renova" por mais ~60 dias
4. Se o token expirar de vez (usuário não usa o sistema por >60 dias, ou
   revoga o acesso manualmente), a próxima chamada falha com `INVALID_GRANT`
   e a conexão fica `ERRO` — é necessário reconectar (mesmo comportamento
   do Google Ads quando o refresh token expira)

## 4. Conta de anúncios

Depois da autorização, o LUVI lista (`GET /me/adaccounts`) todas as contas
de anúncio acessíveis pelo usuário que autorizou, e pede pra escolher uma
(`/clientes/[id]/integracoes/meta/selecionar-conta`). O ID é guardado em
`ClientPlatform.externalAccountId` **sem** o prefixo `act_` (a Graph API
devolve `act_123...`; o `act_` é reconstruído internamente nas chamadas de
Insights).

## 5. Pendência conhecida: conversões

A Meta não tem um campo único "conversões" como o Google
(`metrics.conversions`) — o dado real vem espalhado num array `actions[]`
com dezenas de tipos de evento (`lead`, `purchase`,
`onsite_conversion.*`, `offsite_conversion.*`...). Qual(is) tipo(s) contar
como conversão é uma decisão de negócio que não foi especificada nesta
etapa — para não inventar um número que pareça real mas seja arbitrário,
`conversions` e `conversionValue` ficam sempre em `0` para Meta Ads
(`impressions`/`clicks`/`spend` são reais). Revisitar isso é o próximo
passo natural, quando o usuário definir quais tipos de `actions` contam.

## 6. Segurança dos tokens

Mesmo padrão do Google Ads — `accessTokenEncrypted` em `ClientPlatform`
nunca guarda texto puro (`encryptToken()`, AES-256-GCM,
`TOKEN_ENCRYPTION_KEY`), nunca é enviado ao frontend nem logado.

## 7. Testando (antes de conectar uma conta de produção)

1. Configure as 4 variáveis de ambiente localmente
2. Rode a aplicação (`npm run dev`)
3. Vá em `/clientes/[id]/integracoes` → "Conectar Meta Ads"
4. Autorize com um usuário admin/tester do app (ou já com Business
   Verification aprovada) que tenha acesso a uma conta de anúncios real
5. Escolha a conta na tela de seleção
6. Clique em "Sincronizar agora" em `/clientes/[id]/meta-ads`
7. Confira campanhas/anúncios/métricas (impressões, cliques, investimento)
   aparecendo — conversões ficam em 0 (ver seção 5)
8. Teste "Desconectar" e depois "Conectar" de novo

## 8. Troubleshooting

| Sintoma | Causa provável |
|---|---|
| Card mostra "faltam variáveis: ..." | Uma das 3 env vars da Meta não está definida no ambiente atual |
| Erro "Acesso negado pela Meta" | App sem `ads_read` aprovado (Business Verification pendente) para contas fora de admin/tester |
| Erro "autorização expirou ou foi revogada" | Token de 60 dias expirou por inatividade, ou usuário revogou o acesso pela própria conta Meta — reconectar |
| "Limite de requisições atingido" | Rate limit da Graph API — tentar novamente depois de alguns minutos |
| Redireciona para a Meta mas volta com erro depois do consentimento | `META_REDIRECT_URI` não bate exatamente com a cadastrada no app (precisa ser idêntica) |
| Card do Instagram nunca conecta | Esperado nesta etapa — bloqueado de propósito, ver seção "O que esta etapa NÃO faz" |

## O que esta etapa NÃO faz (por design)

- Não solicita nem implementa nenhuma permissão de Instagram
  (`instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`)
  — o botão "Conectar" do card Instagram nunca chega à Meta.
- Não solicita `ads_management` nem qualquer escopo de escrita — 100%
  somente leitura.
- Não calcula conversões/valor de conversão (ver seção 5).
- Não sincroniza automaticamente em background — sempre manual, pelo botão
  "Sincronizar agora".
