# Handoff — 001-web-app-obras

**Data**: 2026-08-11 (atualizado pós-Fase 5) | **Para retomar em outra sessão/chat**

## Como retomar

Este projeto usa Spec Kit. Numa sessão nova, basta apontar para este arquivo e
para `tasks.md`:

> Leia `specs/001-web-app-obras/handoff.md` e continue a implementação a
> partir da Fase 6 em `tasks.md`.

Ou simplesmente rodar `/speckit-implement` de novo — ele lê
`check-prerequisites.sh`, vê que `tasks.md` já tem T001–T069 marcados `[X]`
(mais T076, T079 adiantadas) e retoma do primeiro `[ ]`.

## Status

**MVP + assinatura + exportação (Fases 1–5, T001–T069) completo, verificado e
no `main`**: 55/55 testes (`npm test`, 10 arquivos), `npm run build` limpo,
`npm run lint` sem erros nos arquivos novos. Commitado e *pushed* — `git log`
mostra `b2a2183` como HEAD de `main`, alinhado com `origin/main`. `git status`
deve vir limpo ao retomar; se não vier, alguém mexeu depois deste handoff.

Funcional: cadastro/login/logout/reset de senha, trial de 14 dias, CRUD de
obras e lançamentos com isolamento por usuário testado, painel com
cards/gráfico/alerta de estouro, rotas públicas preservadas sem redirect,
checkout/portal/webhook do Stripe com os 9 cenários obrigatórios testados,
banner de acesso + redirects de tier, páginas `/app/assinar` e `/app/conta`,
cron de avisos de trial/suspensão, exportação CSV por obra em
`/api/obras/[id]/export` (disponível também em `readonly`, botão no painel da
obra e em `/app/conta`).

**Pendente**: Fase 6 (SEO/conteúdo público), Fase 7 (polish/cleanup —
T059/T076/T079 já adiantadas, resta o restante). Ver checkboxes em
`tasks.md` para o detalhe task-a-task.

**Risco em aberto conhecido (T080, não bloqueia dev/testes)**: o Postgres real
de produção ainda não tem TLS habilitado no host, e `src/db/index.ts` derruba
qualquer request em `NODE_ENV=production` sem `sslmode=require` (guarda
proposital, comentada com `ponytail:`). Se a Vercel fizer deploy automático a
partir de `main`, o app quebra em produção até isso ser resolvido. O usuário
já foi avisado e optou por commitar/pushar mesmo assim — **T080 continua
pendente e é o bloqueio real antes de qualquer deploy funcionar**.

## Ambiente local — precisa recriar se a sessão for em outra máquina

`frontend-next/.env.local` (gitignored, não existe no repo):

```ini
DATABASE_URL=postgres://orcaobra_db:<senha>@2.24.207.200:5455/orcaobra_db?sslmode=disable
DATABASE_URL_TEST=postgres://test:test@localhost:55432/orcaobra_test
AUTH_SECRET=<gerado com openssl rand -base64 32>
AUTH_URL=http://localhost:3000

# Stripe modo teste, conta "Sirius" — já preenchidas nesta sessão
# (valor real só em .env.local — nunca cole a chave aqui, GitHub bloqueia o push)
STRIPE_SECRET_KEY=sk_test_<peça ao usuário ou pegue em dashboard.stripe.com/test/apikeys>
STRIPE_WEBHOOK_SECRET=whsec_placeholder
STRIPE_PRICE_ID=price_1U3FIhD6GTFfNAq4lzRXMZH7

RESEND_API_KEY=re_placeholder
CRON_SECRET=<gerado com openssl rand -hex 32>
TRIAL_DAYS=14
```

- `DATABASE_URL` é o Postgres real do projeto (auto-hospedado, já com o
  schema aplicado). Peça a senha ao usuário se precisar recriar o arquivo —
  não está neste documento de propósito.
- `DATABASE_URL_TEST` aponta para um container Docker descartável:
  ```bash
  docker run -d --name orcaobra-test-db -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test \
    -e POSTGRES_DB=orcaobra_test -p 55432:5432 postgres:16-alpine
  ```
  Se o container não existir mais, recrie com o comando acima — os testes
  (`tests/setup.ts`) aplicam as migrações nele automaticamente antes de rodar.
- `STRIPE_SECRET_KEY` e `STRIPE_PRICE_ID` já são reais (modo teste, conta
  "Sirius" no Stripe, `price_...` = R$ 47,90/mês). O Product/Price foi criado
  via MCP da Stripe nesta sessão.
- `STRIPE_WEBHOOK_SECRET` continua placeholder — só é necessário para rodar
  `stripe listen --forward-to localhost:3000/api/stripe/webhook` de verdade
  no navegador. Os testes automatizados (`webhook.test.ts`) assinam eventos
  sintéticos com o mesmo secret do `.env.local`, então o placeholder não
  bloqueia `npm test`.
- `RESEND_API_KEY` segue placeholder — nenhuma task até agora exigiu envio
  real de e-mail nos testes (todos mockados).

## Decisões que fugiram do texto literal das tasks — merecem revisão

1. **R17 (`sslmode=require`) só é exigido em produção** (`src/db/index.ts`,
   comentado com `ponytail:`). O texto de T011 diz "fora de ambiente de
   teste" (o que incluiria dev), mas o Postgres real do projeto ainda não tem
   TLS habilitado (confirmado empiricamente — conexão com `sslmode=require`
   falha). Gate real só dispara com `NODE_ENV=production`. **T080 precisa
   resolver o TLS do host antes de qualquer deploy real.**
2. `npm run build` local falha com o `.env.local` atual (gate de produção
   dispara durante o build do Next). Contornar com:
   ```bash
   DATABASE_URL="postgres://...?sslmode=require" npm run build
   ```
   (a conexão é lazy — não chega a abrir socket nesse passo, só passa no
   `if`).
3. `fileParallelism: false` em `vitest.config.ts` — o truncate-entre-casos em
   `tests/setup.ts` assume um único banco de teste compartilhado; arquivos em
   paralelo se truncavam uns aos outros no meio dos testes.
4. Três tasks da Fase 7 foram resolvidas de forma antecipada porque caíram
   naturalmente nos arquivos que eu já estava escrevendo: **T059**
   (`banner-acesso.tsx`, já usado no layout `(app)`), **T076**
   (`deleteAccount` em `server/actions/auth.ts`), **T079** (comentário
   `ponytail:` sobre locking otimista em `lancamentos.ts`). Já marcadas `[X]`
   em `tasks.md`.
5. `signUp` foi dividido em `createAccount()` (transação pura, testável) +
   `signUp()` (wrapper que chama `createAccount` e depois `signIn` +
   `redirect`) — necessário porque `signIn`/`redirect` exigem request scope
   do Next.js e não rodam dentro do Vitest.
6. Os testes de isolamento (T050) exercitam a camada de query/mutação SQL
   diretamente (`getObra`, `listLancamentos`, `db.update(...).where(...)`),
   não as Server Actions (`updateObra`, `deleteLancamento`) — essas chamam
   `requireUser()` → `auth()`, que também exige request scope e não roda fora
   de uma requisição real. O mecanismo de isolamento testado é o mesmo `WHERE`
   escopado por `user_id`/join que as actions usam por baixo.
7. `computeTransition` (`src/server/stripe/webhook.ts`) chama
   `stripe.subscriptions.retrieve()` para obter `current_period_end` — esse
   campo saiu do objeto `Subscription` nas versões recentes da API Stripe
   (agora vive em `subscription.items.data[0].current_period_end`); o
   `invoice.parent.subscription_details.subscription` também é uma
   reestruturação recente (não é mais `invoice.subscription` direto).
   Confirmado lendo os `.d.ts` do SDK instalado (`stripe@^22.5.0`, apiVersion
   pinada `2026-07-29.dahlia`) — se atualizar o SDK, reconferir esses campos.
8. As mensagens de negação de `requireFullAccess` (T064) só aparecem de fato
   em `lancamento-form.tsx` (criar/editar lançamento não tem redirect de
   página, diferente de `obras/nova`/`obras/[id]/editar` que T060 já
   redireciona). `obra-form.tsx` ganhou o mesmo tratamento por consistência,
   mas é código morto na prática desde que T060 bloqueia a página antes.
9. O MCP da Stripe usado nesta sessão (conta "Sirius") só resolve operações
   depois de reconectar com o toggle de *test mode* explicitamente liberado —
   por padrão a sessão só trazia escopo de modo live. Se o MCP voltar a
   retornar zero operações em buscas com `livemode: false`, é esse o motivo:
   reconectar via `manage_stripe_accounts` e garantir test mode marcado.
10. **Fase 5**: `listLancamentos` (usada na tela de lançamentos) é paginada em
    50/página e não serve à exportação, que precisa de todos os lançamentos da
    obra. Em vez de parametrizar a paginação existente, criei
    `listLancamentosParaExport(userId, obraId)` em
    `db/queries/lancamentos.ts` — mesma query escopada por join, sem `LIMIT`.
    T069 testa a exportação pela camada de query (`getObra` +
    `listLancamentosParaExport` + `lancamentosParaCsv`), não pela rota HTTP:
    a rota chama `requireUser()` → `auth()`, que exige request scope e não
    roda no Vitest (mesma limitação de T050, item 6 acima). O botão em
    `/app/conta` lista **todas** as obras não arquivadas do usuário com um
    link de exportação cada uma — a página não tinha contexto de obra antes
    disso.

## Próximo passo imediato

Fase 6 (SEO/conteúdo público) — T070–T074, ver `contracts/http-routes.md` e
[spec.md](./spec.md) FR-031 a FR-034. Depende das Fases 3 e 4 (já prontas).
Envolve decisão de conteúdo (copy da home/`Pricing.tsx`), então vale confirmar
o tom antes de reescrever.
