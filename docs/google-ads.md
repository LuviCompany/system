# Integração Google Ads (etapa 5)

Integração real, somente leitura, com o Google Ads via OAuth 2.0. Não cria,
edita, pausa nem exclui nada no Google Ads — só lê campanhas, anúncios e
métricas e guarda uma cópia normalizada no banco do LUVI.

## Arquitetura

```
src/server/integrations/
  ads-provider.ts          # contrato genérico (Google/Meta implementam isso)
  google-ads/
    config.ts              # leitura das env vars (única porta de entrada)
    errors.ts               # GoogleAdsError + mapeamento de erros HTTP/OAuth
    oauth.ts                # authUrl, exchangeCodeForTokens, refresh, revoke
    state.ts                 # assina/verifica o `state` do OAuth (JWT curto)
    client.ts                # HTTP client de baixo nível da Google Ads API
    reporting.ts             # queries GAQL (somente leitura)
    normalization.ts         # micros -> moeda, formato bruto -> modelo interno
    provider.ts               # GoogleAdsProvider implements AdsProvider
    connection.service.ts    # CRUD da conexão (ClientPlatform), tokens sempre criptografados
    sync.ts                   # orquestra fetch + normalização + upsert no Postgres
    actions.ts                 # server actions (listar contas, selecionar, sincronizar, desconectar)

src/server/security/token-crypto.ts   # AES-256-GCM genérico (não é específico do Google)
```

Nenhum arquivo de Google Ads conhece Meta Ads, e vice-versa — a única
coisa compartilhada é o contrato `AdsProvider`.

## 1. Configuração no Google Cloud

1. Crie (ou reaproveite) um projeto em https://console.cloud.google.com
2. Ative a **Google Ads API** em "APIs e serviços" → "Biblioteca"
3. Em "APIs e serviços" → "Tela de consentimento OAuth": configure como
   "Externo" (ou "Interno" se for Google Workspace), preencha nome do app,
   e-mail de suporte, domínio autorizado
4. Em "Credenciais" → "Criar credenciais" → "ID do cliente OAuth":
   - Tipo de aplicativo: **Aplicativo da Web**
   - URIs de redirecionamento autorizados: a mesma URL que vai em
     `GOOGLE_REDIRECT_URI` (ver seção 3)
   - Copie o **Client ID** e o **Client Secret** gerados

## 2. Developer Token do Google Ads

1. Acesse https://ads.google.com com uma conta de **gerente (MCC)**
2. Ferramentas e configurações → Configuração → Centro de API
3. Solicite um Developer Token
4. Por padrão ele nasce em nível **Test** — só funciona com contas de teste
   do Google Ads. Para acessar contas reais, é preciso solicitar elevação
   para **Basic** ou **Standard** (aprovação do Google, pode levar dias)

## 3. Variáveis de ambiente

Adicione ao `.env` (nunca commitar valores reais — ver `.env.example`):

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google-ads/callback

# Criptografia dos tokens em repouso — gerar com:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
TOKEN_ENCRYPTION_KEY=
```

Em produção, `GOOGLE_REDIRECT_URI` precisa ser a URL pública do domínio
(ex: `https://system-psi-seven.vercel.app/api/integrations/google-ads/callback`)
e essa mesma URL precisa estar cadastrada nos "URIs de redirecionamento
autorizados" do Client OAuth no passo 1.

Se qualquer uma das 4 variáveis do Google Ads estiver ausente, a interface
mostra isso claramente (card "Google Ads" em `/clientes/[id]/integracoes`
e `/clientes/[id]/integracoes/google`) — a aplicação nunca tenta adivinhar
ou seguir sem elas.

## 4. Customer ID (conta a conectar)

Depois da autorização, o LUVI lista automaticamente (via
`customers:listAccessibleCustomers`) todas as contas que o usuário
autorizado pode acessar, e pede pra escolher uma
(`/clientes/[id]/integracoes/google/selecionar-conta`). O ID escolhido é
guardado em `ClientPlatform.externalAccountId` (só dígitos, sem hífen).

Se a conta escolhida for gerenciada por uma conta de gerente (MCC), pode ser
necessário informar o `login-customer-id` — hoje isso fica em
`ClientPlatform.metadata.loginCustomerId`; a etapa atual não tem UI para
preencher isso manualmente (ver "Pendências" abaixo).

## 5. Segurança dos tokens

- `accessTokenEncrypted`/`refreshTokenEncrypted` em `ClientPlatform` NUNCA
  guardam texto puro — sempre passam por `encryptToken()`
  (AES-256-GCM, chave em `TOKEN_ENCRYPTION_KEY`).
- O refresh token nunca é enviado ao frontend, nunca aparece em nenhuma
  resposta de server action, nunca é logado.
- Trocar `TOKEN_ENCRYPTION_KEY` invalida todas as conexões existentes (elas
  precisarão ser reconectadas) — trate como um segredo tão sensível quanto
  `AUTH_SECRET`.

## 6. Testando (antes de conectar uma conta de produção)

1. Configure as 5 variáveis de ambiente localmente
2. Rode a aplicação (`npm run dev`)
3. Vá em `/clientes/[id]/integracoes/google` → "Conectar Google Ads"
4. Autorize com uma conta que tenha acesso a uma conta Google Ads de teste
5. Escolha a conta na tela de seleção
6. Clique em "Sincronizar agora" em `/clientes/[id]/google-ads`
7. Confira campanhas/anúncios/métricas aparecendo
8. Teste "Desconectar" e depois "Conectar" de novo (deve pedir consentimento
   de novo, já que usamos `prompt=consent`)

## 7. Troubleshooting

| Sintoma | Causa provável |
|---|---|
| Card mostra "faltam variáveis: ..." | Uma das 4 env vars do Google Ads não está definida no ambiente atual |
| Erro "Acesso negado pelo Google Ads" | Developer Token ainda em nível Test tentando acessar conta real, ou a conta escolhida não dá permissão de leitura ao usuário que autorizou |
| Erro "autorização expirou ou foi revogada" (`invalid_grant`) | O usuário revogou o acesso pela própria conta Google, ou o refresh token expirou por inatividade prolongada — é necessário reconectar |
| "Limite de requisições atingido" | Rate limit da Google Ads API — tentar novamente depois de alguns minutos |
| Redireciona para o Google mas volta com erro depois do consentimento | `GOOGLE_REDIRECT_URI` não bate exatamente com o cadastrado no Google Cloud Console (precisa ser idêntico, incluindo `http`/`https` e barra final) |
| Callback dá "state inválido ou expirado" | Mais de 10 minutos entre iniciar o fluxo e o Google redirecionar de volta — tentar conectar de novo |

## O que esta etapa NÃO faz (por design)

- Não cria, edita, pausa ou remove campanhas/anúncios/orçamentos —
  100% somente leitura (nenhum endpoint `mutate` é chamado em nenhum lugar
  deste módulo).
- Não implementa Meta Ads, Instagram API ou Google Analytics.
- Não sincroniza automaticamente em background — a sincronização é sempre
  manual, pelo botão "Sincronizar agora" (uma sincronização automática/
  agendada é um próximo passo natural, não implementado aqui).
- Não tem UI para configurar `loginCustomerId` de contas gerenciadas por um
  MCC — hoje só funciona de ponta a ponta para contas Google Ads standalone
  (não-MCC) sem essa necessidade.
