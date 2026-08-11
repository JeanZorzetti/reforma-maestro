# Handoff — 001-web-app-obras

**Data**: 2026-08-11 (atualizado pós-Fase 7 parcial) | **Para retomar em outra sessão/chat**

## Como retomar

Este projeto usa Spec Kit. Numa sessão nova, basta apontar para este arquivo e
para `tasks.md`:

> Leia `specs/001-web-app-obras/handoff.md` e continue a implementação a
> partir do que resta da Fase 7 em `tasks.md`.

Ou simplesmente rodar `/speckit-implement` de novo — ele lê
`check-prerequisites.sh`, vê que `tasks.md` já tem T001–T087 marcados `[X]`
(T077 marcada `[~]`, parcial — ver abaixo) e retoma do primeiro `[ ]`
(T080).

## Status

**MVP + assinatura + exportação + SEO/conteúdo público + a maior parte da
Fase 7 (polish) completos e no `main`**: 55/55 testes (`npm test`, 10
arquivos), `npm run build` limpo, `npm run lint` sem erro novo introduzido em
nenhuma sessão até agora (31 problemas pré-existentes em boilerplate
shadcn/ui e em duas linhas de `banner-acesso.tsx`/`lancamento-form.tsx` que
ninguém tocou). Commitado e *pushed* para `main`.

Desde o handoff anterior (pós-Fase 6), esta sessão fechou:

- **T075**: página pública `/privacidade` (retenção de dados + como pedir
  exclusão via `suporte@roilabs.com.br` + LGPD), linkada no rodapé.
- **T077 (parcial)**: `getPainelTotais` + `getPainelPorCategoria` medidos
  contra 500 lançamentos no banco de teste — p95 = **42,9 ms**, bem abaixo do
  limite de 200 ms, nenhum ajuste de índice necessário. **O LCP em 3G segue
  não verificado** — precisa de um Lighthouse contra um deploy real; não deu
  para medir localmente porque o dev server local aponta para o Postgres de
  produção (`.env.local`) e não fazia sentido popular 500 linhas de teste
  nele.
- **T078**: revisão de responsividade mobile via código (sem servidor de
  teste disponível para uma sessão de browser ao vivo sem escrever no
  Postgres de produção). Corrigidos 3 cabeçalhos que empilhavam título +
  botões sem `flex-wrap`/empilhamento e estouravam por volta de 375px:
  `obras/[id]/page.tsx`, `obras/[id]/lancamentos/page.tsx` e o seletor de
  obras (`app/page.tsx`). A tabela de lançamentos já tinha `overflow-auto`
  (padrão shadcn) e o gráfico já usa `ResponsiveContainer` — nenhum ajuste
  necessário ali.
- **T082–T084**: removidos `frontend/` (protótipo Lovable), os 4 scripts de
  planilha em `frontend-next/scripts/` e as dependências `googleapis` /
  `google-auth-library` do `package.json`. Build confirmado limpo depois.
- **T085**: `docs/VISAO-GERAL-DO-PROJETO.md` reescrito do zero — descrevia
  ainda o produto antigo (landing page de planilha + checkout Kiwify, "sem
  backend"). Agora reflete o web app com assinatura Stripe.
- **T087**: eventos GA4 `obra_criada`, `lancamento_criado` e
  `assinatura_concluida` instrumentados via `lib/analytics.ts` (`gtag`
  já estava carregado no `layout.tsx`) — disparados no client depois do
  sucesso das Server Actions correspondentes e no retorno do Checkout
  (`?checkout=sucesso` em `/app/conta`, via `CheckoutSuccessTracker`).
- **T086**: checklist final rodado — `npm test` (55/55), `npm run build`,
  `npm run lint` (sem novo erro), isolamento coberto pelo automatizado
  (T050), `robots.txt`/`sitemap.xml`/`noindex`/structured data conferidos
  contra o dev server já ativo (sem `aggregateRating` fabricado).

**Pendente**: **T080, T081 e T088** — os três itens que sempre exigiram ação
humana fora do que um agente de código resolve sozinho:

- **T080 (bloqueia deploy real)**: `sslmode=require` ainda não está habilitado
  no Postgres de produção; `src/db/index.ts` derruba qualquer request em
  `NODE_ENV=production` sem isso (guarda proposital, comentada
  `ponytail:`). Se a Vercel fizer deploy automático a partir de `main`, o app
  quebra em produção até isso ser resolvido no host do Postgres.
- **T081**: cadastrar o webhook de produção no Stripe apontando para o
  domínio final, configurar a retry/dunning policy com 7 dias de tolerância
  e definir as variáveis de ambiente de produção na Vercel.
- **T088**: teste de usabilidade com 3–5 pessoas do público-alvo — só faz
  sentido com pessoas reais, não é executável só por IA.

## Ambiente local — precisa recriar se a sessão for em outra máquina

`frontend-next/.env.local` (gitignored, não existe no repo):

```ini
DATABASE_URL=postgres://orcaobra_db:<senha>@2.24.207.200:5455/orcaobra_db?sslmode=disable
DATABASE_URL_TEST=postgres://test:test@localhost:55432/orcaobra_test
AUTH_SECRET=<gerado com openssl rand -base64 32>
AUTH_URL=http://localhost:3000

# Stripe modo teste, conta "Sirius"
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
- **Cuidado ao rodar `npm run dev` localmente**: sem override, ele conecta no
  Postgres de produção real (`DATABASE_URL` do `.env.local`). Para testar UI
  ao vivo sem sujar dados reais, suba com
  `DATABASE_URL="postgres://test:test@localhost:55432/orcaobra_test" npm run dev`
  — mas confira antes se já não há um `next dev` rodando na mesma pasta
  (lockfile do Next recusa uma segunda instância no mesmo `.next/`).
- `STRIPE_SECRET_KEY` e `STRIPE_PRICE_ID` já são reais (modo teste, conta
  "Sirius" no Stripe, `price_...` = R$ 47,90/mês).
- `STRIPE_WEBHOOK_SECRET` continua placeholder — só é necessário para rodar
  `stripe listen --forward-to localhost:3000/api/stripe/webhook` de verdade
  no navegador. Os testes automatizados (`webhook.test.ts`) assinam eventos
  sintéticos com o mesmo secret do `.env.local`, então o placeholder não
  bloqueia `npm test`.
- `RESEND_API_KEY` segue placeholder — nenhuma task até agora exigiu envio
  real de e-mail nos testes (todos mockados).

## Decisões que fugiram do texto literal das tasks — merecem revisão

1. **R17 (`sslmode=require`) só é exigido em produção** (`src/db/index.ts`,
   comentado com `ponytail:`). O Postgres real do projeto ainda não tem TLS
   habilitado (confirmado empiricamente). Gate real só dispara com
   `NODE_ENV=production`. **T080 precisa resolver o TLS do host antes de
   qualquer deploy real.**
2. `npm run build` local falha com o `.env.local` atual (gate de produção
   dispara durante o build do Next). Contornar com:
   ```bash
   DATABASE_URL="postgres://...?sslmode=require" npm run build
   ```
   (a conexão é lazy — não chega a abrir socket nesse passo, só passa no
   `if`).
3. `fileParallelism: false` em `vitest.config.ts` — o truncate-entre-casos em
   `tests/setup.ts` assume um único banco de teste compartilhado.
4. Três tasks da Fase 7 foram resolvidas de forma antecipada em sessões
   anteriores porque caíram naturalmente nos arquivos que já estavam sendo
   escritos: T059, T076, T079. Já marcadas `[X]` em `tasks.md`.
5. `signUp` foi dividido em `createAccount()` (transação pura, testável) +
   `signUp()` (wrapper que chama `createAccount` e depois `signIn` +
   `redirect`).
6. Os testes de isolamento (T050) exercitam a camada de query/mutação SQL
   diretamente, não as Server Actions — essas exigem request scope e não
   rodam fora de uma requisição real. O mecanismo de isolamento testado é o
   mesmo `WHERE` escopado por `user_id`/join que as actions usam por baixo.
7. `computeTransition` (`src/server/stripe/webhook.ts`) lê campos que
   mudaram de lugar em versões recentes da API Stripe — reconferir se o SDK
   for atualizado (`stripe@^22.5.0`, apiVersion `2026-07-29.dahlia`).
8. As mensagens de negação de `requireFullAccess` (T064) só aparecem de fato
   em `lancamento-form.tsx`; `obra-form.tsx` ganhou o mesmo tratamento por
   consistência, mas é código morto na prática desde que T060 bloqueia a
   página antes.
9. O MCP da Stripe usado em sessão anterior (conta "Sirius") só resolve
   operações depois de reconectar com o toggle de *test mode* explicitamente
   liberado.
10. **Fase 5**: `listLancamentosParaExport(userId, obraId)` foi criada à
    parte de `listLancamentos` (paginada) porque a exportação precisa de
    todos os lançamentos sem `LIMIT`. O botão em `/app/conta` lista todas as
    obras não arquivadas com um link de exportação cada uma.
11. **Fase 6**: tom de copy confirmado com o usuário (direto e sóbrio, sem
    urgência artificial). O `aggregateRating` fabricado no schema `Product`
    foi removido e o schema virou `SoftwareApplication` — confirmado ainda
    ausente nesta sessão via `curl` contra o dev server ativo.
12. **`deleteAccount` (T076) não tem botão na UI** — a Server Action existe
    (`server/actions/auth.ts`) e é referenciada na página `/privacidade`
    como "solicite por e-mail", porque não havia task numerada para wirar um
    botão de autoatendimento em `/app/conta`. Se isso incomodar, vale abrir
    como task nova em vez de resolver por engenharia reversa do texto de
    T075/T076.

## Débito de conteúdo sinalizado, fora de qualquer task numerada

Os artigos do blog (`frontend-next/src/data/blog-posts.ts`) ainda promovem
"planilha" como entregável em vários pontos. `tasks.md` não lista nenhuma
task de reescrita de blog — vale revisar antes do lançamento real.

## Próximo passo imediato

Restam apenas os três itens de pré-lançamento que exigem ação fora de código:
**T080** (TLS de produção no host Postgres — bloqueia qualquer deploy real),
**T081** (webhook de produção no Stripe + env vars na Vercel) e **T088**
(teste de usabilidade com pessoas reais). Nenhum dos três é executável só por
IA — T080 e T081 exigem acesso a paineis externos (o host do Postgres e o
dashboard da Vercel/Stripe) que uma sessão de agente não tem sozinha, e T088
exige participantes humanos.
