---

description: "Task list for 001-web-app-obras"
---

# Tasks: Web App de Controle Financeiro de Obras

**Input**: Design documents from `/specs/001-web-app-obras/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: incluídos **apenas** no recorte que a constitution torna obrigatório —
autenticação, escopo de dados por usuário, cálculo financeiro e estado de
assinatura (Development Workflow + R16). Conteúdo, marketing e UI seguem sem
teste automatizado.

**Organization**: agrupadas por user story, para que cada uma seja implementável
e testável de forma independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos distintos, sem dependência pendente)
- **[Story]**: user story a que a task pertence (US1–US4)
- Todo caminho é relativo à raiz do repositório

## Path Conventions

Projeto único full-stack em `frontend-next/` (Princípio III). Código em
`frontend-next/src/`, testes em `frontend-next/tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: instalar dependências, configurar ferramentas e reorganizar as
rotas existentes sem alterar nenhuma URL.

- [ ] T001 Instalar dependências de runtime em `frontend-next/package.json`: `next-auth@^5`, `@auth/drizzle-adapter`, `drizzle-orm`, `postgres`, `bcryptjs`, `stripe`, `resend`
- [ ] T002 Instalar dependências de desenvolvimento em `frontend-next/package.json`: `drizzle-kit`, `vitest`, `@types/bcryptjs`, `dotenv`
- [ ] T003 [P] Criar `frontend-next/drizzle.config.ts` apontando schema para `src/db/schema.ts`, saída para `src/db/migrations/` e `dialect: 'postgresql'`
- [ ] T004 [P] Criar `frontend-next/vitest.config.ts` com ambiente `node`, `include` de `tests/**/*.test.ts` e `setupFiles: ['tests/setup.ts']`
- [ ] T005 [P] Criar `frontend-next/tests/setup.ts` que carrega `.env.local`, aborta se `DATABASE_URL_TEST` estiver ausente ou for igual a `DATABASE_URL`, aplica as migrações e expõe helper de `truncate` entre casos — o arquivo é escrito aqui, mas **só executa depois de T015** (a primeira migração não existe antes disso)
- [ ] T006 [P] Criar `frontend-next/.env.example` com todas as variáveis de [quickstart.md](./quickstart.md), valores vazios e comentário de origem; confirmar que `.env.local` está no `.gitignore`
- [ ] T007 [P] Adicionar scripts em `frontend-next/package.json`: `test`, `test:watch`, `db:generate` (`drizzle-kit generate`), `db:migrate` (`drizzle-kit migrate`)
- [ ] T008 [P] Criar `frontend-next/vercel.json` com um cron diário para `/api/cron/trial-warnings`
- [ ] T009 Mover `src/app/page.tsx`, `src/app/blog/` e `src/app/sobre/` para o route group `src/app/(public)/`, mantendo `layout.tsx`, `robots.ts`, `sitemap.ts`, `not-found.tsx` e `globals.css` na raiz de `src/app/`
- [ ] T010 Rodar `npm run dev` e confirmar que `/`, `/blog`, `/blog/<slug>` e `/sobre` respondem **200 sem redirect** após a movimentação (FR-031, FR-032)

**Checkpoint**: projeto instala, builda e serve as rotas públicas exatamente nas mesmas URLs.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: banco, schema, autenticação, camada de acesso e lógica financeira
pura. Tudo aqui é pré-requisito de qualquer user story.

**⚠️ CRITICAL**: nenhuma user story pode começar antes desta fase terminar.

### Banco e schema

- [ ] T011 Criar `frontend-next/src/db/index.ts` com a conexão `postgres.js` + Drizzle, lendo `DATABASE_URL` e **falhando na inicialização** se a URL não contiver `sslmode=require` fora de ambiente de teste (R17, Princípio V)
- [ ] T012 Definir enums `categoria` e `subscription_status` e as tabelas `users`, `sessions`, `accounts`, `verification_tokens` em `frontend-next/src/db/schema.ts` conforme [data-model.md](./data-model.md)
- [ ] T013 Definir as tabelas `obras` e `lancamentos` em `frontend-next/src/db/schema.ts`, com todos os CHECKs (`orcamento_teto_cents > 0`, `reserva_pct` entre 0 e 100, valores `>= 0`) e os índices `(user_id, arquivada_em)`, `(obra_id, data DESC)` e `(obra_id, categoria)`
- [ ] T014 Definir as tabelas `subscriptions`, `trial_grants`, `stripe_events` e `audit_log` em `frontend-next/src/db/schema.ts`, com `audit_log.user_id` em `ON DELETE SET NULL`, as demais FKs em `CASCADE` e os marcadores de notificação `trial_warned_at` e `suspensao_avisada_em` em `subscriptions` (usados por T063)
- [ ] T015 Gerar a migração inicial com `npm run db:generate`, escrever à mão o `frontend-next/src/db/migrations/0000_*.down.sql` correspondente e aplicar com `npm run db:migrate`

### Lógica pura (testada)

- [ ] T016 [P] Implementar `frontend-next/src/lib/money.ts`: parse de string pt-BR para centavos, formatação `Intl.NumberFormat('pt-BR', {currency:'BRL'})`, soma e arredondamento meio-para-cima (R10)
- [ ] T017 [P] Escrever `frontend-next/tests/unit/money.test.ts` cobrindo parse de `"85.000,00"`, `"1.200"`, `"0,05"`, entrada inválida, e ausência de erro de ponto flutuante ao somar 500 valores
- [ ] T018 [P] Implementar `frontend-next/src/lib/calc.ts` com os derivados de [data-model.md](./data-model.md): `reservaCents`, `saldoCents`, `saldoDisponivelCents`, `pctConsumido`, `excedidoCents`, `statusLancamento`, `diferencaCents`
- [ ] T019 [P] Escrever `frontend-next/tests/unit/calc.test.ts` cobrindo obra sem lançamentos, `pago == previsto` (Pago), `pago < previsto` (Pendente), `pago > previsto` (estouro no item), estouro do orçamento teto e reserva de 0% e 100%
- [ ] T020 Implementar `frontend-next/src/lib/access.ts` com `getAccess(userId)` retornando `{ tier, status, accessUntil }` conforme a tabela-verdade de R4, mais `requireUser()` e `requireFullAccess()`
- [ ] T021 Escrever `frontend-next/tests/unit/access.test.ts` cobrindo **todas** as linhas da tabela de R4: `trialing` dentro e fora do prazo, `active`, `canceled` antes e depois de `access_until`, `past_due` e `expired` (FR-019, SC-010)

### Autenticação

- [ ] T022 Implementar `frontend-next/src/lib/auth.ts`: Auth.js v5 com `@auth/drizzle-adapter`, Credentials provider, `session.strategy = 'database'`, `maxAge` de 30 dias, `updateAge` de 24 h e bcrypt custo 12; registrar `login` e `login_failed` em `audit_log` nos callbacks (R7, FR-003, FR-030)
- [ ] T023 Criar o handler `frontend-next/src/app/api/auth/[...nextauth]/route.ts`
- [ ] T024 Implementar `frontend-next/src/lib/audit.ts` com `logAudit(userId, event, detail)` gravando em `audit_log`, garantindo que `detail` nunca receba senha, hash, token ou chave (FR-030)
- [ ] T025 Implementar `frontend-next/src/lib/email.ts` com `sendEmail()` via Resend e os três templates: reset de senha, trial expirando e falha de pagamento (R8)
- [ ] T026 Implementar `signUp` em `frontend-next/src/server/actions/auth.ts`: normaliza o e-mail, cria `users` com bcrypt, grava `trial_grants` e cria `subscriptions` — **em uma única transação**; se o hash já existir em `trial_grants`, a assinatura nasce `expired`; em caso de sucesso, cria a sessão e redireciona ao cadastro da primeira obra (FR-025, FR-025c, US1-1)
- [ ] T027 Implementar `signOut`, `requestPasswordReset` e `resetPassword` em `frontend-next/src/server/actions/auth.ts`, conforme [contracts/server-actions.md](./contracts/server-actions.md) — `requestPasswordReset` responde `ok: true` sempre, e `resetPassword` invalida todas as sessões do usuário (FR-002, FR-003)
- [ ] T028 Escrever `frontend-next/tests/integration/auth.test.ts` cobrindo: cadastro cria as três linhas na mesma transação, e-mail duplicado é rejeitado, e-mail é normalizado antes da busca, senha nunca retorna da action, token de reset é de uso único, reset invalida as sessões existentes e sessão com `expires` no passado é recusada (FR-003)
- [ ] T029 Escrever `frontend-next/tests/integration/trial.test.ts`: conta nova nasce `trialing` com 14 dias; após `DELETE` da conta e recadastro **com o mesmo e-mail**, a nova conta nasce `expired` (FR-025c, SC-012)
- [ ] T030 Criar `frontend-next/src/middleware.ts` protegendo `/app/*` — verifica **apenas sessão** e redireciona para `/entrar?next=<path>`; o tier nunca é lido de cookie (FR-019)
- [ ] T031 [P] Criar as páginas do route group `frontend-next/src/app/(auth)/`: `entrar/`, `cadastrar/`, `recuperar-senha/` e `redefinir-senha/[token]/`, com `metadata.robots = { index: false, follow: false }` no layout do grupo

**Checkpoint**: é possível criar conta, entrar, sair e recuperar senha; toda conta nova nasce em trial; a camada de acesso está testada e pronta para uso.

---

## Phase 3: User Story 1 — Controlar o orçamento da obra (P1) 🎯 MVP

**Goal**: cadastrar obra, registrar gastos e ver o painel refletindo os
lançamentos sem que o usuário faça conta alguma.

**Independent Test**: com uma conta provisionada, cadastrar uma obra, lançar uma
série de gastos e conferir que totais, saldo, percentual consumido e quebra por
categoria batem com os lançamentos — cenários V1 do [quickstart.md](./quickstart.md).

### Leituras escopadas

- [ ] T032 [P] [US1] Implementar `frontend-next/src/db/queries/obras.ts`: `listObras(userId)`, `getObra(userId, obraId)` — todo `WHERE` inclui `user_id`, e obra de outro usuário retorna `null` (FR-029)
- [ ] T033 [P] [US1] Implementar `frontend-next/src/db/queries/lancamentos.ts`: listagem paginada (50/página) ordenada por `data DESC`, com filtros de categoria e de status aplicados no `WHERE`, sempre com join escopado por `obras.user_id` (FR-012, FR-029)
- [ ] T034 [P] [US1] Implementar `frontend-next/src/db/queries/painel.ts` com duas queries agregadas em SQL — totais (`SUM`) e quebra por categoria (`GROUP BY`) — sem trazer lançamentos ao cliente (R12, SC-009)

### Mutações

- [ ] T035 [US1] Implementar os schemas Zod de obra e lançamento em `frontend-next/src/server/actions/schemas.ts`, com as mensagens de erro de FR-005 e conversão pt-BR → centavos via `money.ts`
- [ ] T036 [US1] Implementar `createObra`, `updateObra`, `archiveObra` e `deleteObra` em `frontend-next/src/server/actions/obras.ts` conforme [contracts/server-actions.md](./contracts/server-actions.md), com `requireUser` → `requireFullAccess` → escopo, e `revalidatePath` ao final (FR-004 a FR-007a)
- [ ] T037 [US1] Implementar `createLancamento`, `updateLancamento` e `deleteLancamento` em `frontend-next/src/server/actions/lancamentos.ts`, **ignorando** `status` e `diferenca` recebidos do cliente e verificando posse por join (FR-008 a FR-011)

### UI

- [ ] T038 [P] [US1] Criar o layout do route group `frontend-next/src/app/(app)/layout.tsx` com `metadata.robots = { index: false, follow: false }` e a navegação do app (FR-033)
- [ ] T039 [P] [US1] Criar `frontend-next/src/app/(app)/app/page.tsx` — seletor de obras, redirecionando para o cadastro quando a conta não tem nenhuma (FR-007)
- [ ] T040 [P] [US1] Criar o componente de formulário de obra em `frontend-next/src/components/app/obra-form.tsx` (React Hook Form + Zod), com máscara de valor em reais e de percentual
- [ ] T041 [US1] Criar `frontend-next/src/app/(app)/app/obras/nova/page.tsx` e `frontend-next/src/app/(app)/app/obras/[id]/editar/page.tsx` reusando `obra-form.tsx`
- [ ] T042 [P] [US1] Criar os cards de indicador em `frontend-next/src/components/app/painel-cards.tsx`: total previsto, total pago, saldo restante, percentual consumido e fundo de reserva explícito (FR-014, FR-017)
- [ ] T043 [P] [US1] Criar `frontend-next/src/components/app/alerta-estouro.tsx`, exibido apenas quando `excedidoCents > 0`, informando o valor excedido de forma inequívoca (FR-016, SC-004)
- [ ] T044 [P] [US1] Criar `frontend-next/src/components/app/grafico-categorias.tsx` com Recharts, consumindo a agregação de `painel.ts` (FR-015)
- [ ] T045 [US1] Criar `frontend-next/src/app/(app)/app/obras/[id]/page.tsx` (Server Component) compondo cards, alerta de estouro e gráfico a partir das queries agregadas
- [ ] T046 [P] [US1] Criar o formulário de lançamento em `frontend-next/src/components/app/lancamento-form.tsx`, com data em `dd/MM/yyyy`, seleção fechada de categoria, aviso discreto para data futura e rascunho em `sessionStorage` restaurado ao voltar de uma sessão expirada (FR-008, FR-009, FR-013, edge case de sessão)
- [ ] T047 [US1] Criar `frontend-next/src/app/(app)/app/obras/[id]/lancamentos/page.tsx` com a lista paginada, os filtros de categoria e status, e as colunas de status e diferença derivadas (FR-010, FR-012)
- [ ] T048 [US1] Implementar edição e exclusão de lançamento na lista, com confirmação na exclusão e atualização imediata dos indicadores via `revalidatePath` (FR-011, US1-7)
- [ ] T049 [US1] Implementar a confirmação de exclusão de obra informando quantos lançamentos serão perdidos e exigindo digitar o nome da obra (FR-007a, edge case)

### Testes obrigatórios

- [ ] T050 [US1] Escrever `frontend-next/tests/integration/isolamento.test.ts`: usuário A não lê nem escreve obra ou lançamento de B por nenhum caminho — `getObra`, listagem, `updateObra`, `updateLancamento`, `deleteLancamento` — e o retorno é sempre `NAO_ENCONTRADO`, nunca `SEM_PERMISSAO` (FR-029, SC-006)
- [ ] T051 [US1] Escrever `frontend-next/tests/integration/painel.test.ts`: com lançamentos conhecidos, as queries agregadas devolvem exatamente os totais esperados, inclusive com obra vazia e com lançamento de valor pago acima do previsto

**Checkpoint**: US1 entregue e testável de ponta a ponta — o produto já substitui a planilha. **Este é o MVP.**

---

## Phase 4: User Story 2 — Testar, assinar e manter o acesso (P2)

**Goal**: trial sem cartão, assinatura automática após pagamento e degradação
previsível de acesso, sem intervenção manual.

**Independent Test**: simular trial em andamento, trial expirado, assinatura
confirmada, cancelada e inadimplente e verificar que o acesso concedido em cada
estado corresponde ao documentado — cenários V2 do [quickstart.md](./quickstart.md).

**Depends on**: Fase 2 (`access.ts`, `subscriptions`) e Fase 3 (há o que liberar).

- [ ] T052 [P] [US2] Implementar `frontend-next/src/lib/stripe.ts`: cliente Stripe e o mapa `subscription.status` do Stripe → nosso `status`, conforme [contracts/stripe-webhook.md](./contracts/stripe-webhook.md)
- [ ] T053 [US2] Implementar `createCheckoutSession` e `createPortalSession` em `frontend-next/src/server/actions/assinatura.ts` — **sem** `requireFullAccess`, com `client_reference_id = user.id` e sem escrever em `subscriptions` (FR-018, FR-024, R6)
- [ ] T053a [US2] Em `createCheckoutSession`, passar `subscription_data.trial_end = subscriptions.access_until` quando o status for `trialing` e o acesso ainda estiver vigente, para que quem assina antes do fim do trial não perca os dias restantes (R2, edge case do spec)
- [ ] T054 [US2] Criar `frontend-next/src/app/api/stripe/webhook/route.ts` com runtime `nodejs`, corpo lido como `req.text()` e `constructEvent` — assinatura inválida retorna `400` e não grava nada
- [ ] T055 [US2] Implementar no mesmo handler o pipeline transacional de [contracts/stripe-webhook.md](./contracts/stripe-webhook.md): `INSERT ... ON CONFLICT DO NOTHING` em `stripe_events`, resolução do usuário em três níveis, checagem de `event.created >= last_event_at` e aplicação da transição (FR-020)
- [ ] T056 [US2] Implementar os cinco handlers de evento (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`), gravando `access_until = max(current_period_end, access_until)` para nunca encurtar acesso já garantido, e mapeando `cancel_at_period_end` → `status = 'canceled'` com acesso até `current_period_end` (FR-018, FR-021, FR-022)
- [ ] T057 [US2] Disparar o e-mail de falha de pagamento a partir de `invoice.payment_failed` e registrar `subscription_changed` em `audit_log` a cada transição aplicada (FR-023, FR-030)
- [ ] T058 [US2] Escrever `frontend-next/tests/integration/webhook.test.ts` cobrindo **os nove cenários obrigatórios** de [contracts/stripe-webhook.md](./contracts/stripe-webhook.md), com destaque para evento duplicado, evento fora de ordem, evento sem usuário resolvível e assinatura no meio do trial sem perda de dias (FR-020, R2, R6)
- [ ] T059 [P] [US2] Criar `frontend-next/src/components/app/banner-acesso.tsx`: em `trialing` mostra os dias restantes com CTA de assinatura; em `readonly` explica o estado e linka `/app/assinar` (FR-025a, FR-022)
- [ ] T060 [US2] Aplicar o banner no layout de `(app)` e fazer as rotas de tier `full` (`obras/nova`, `obras/[id]/editar`) redirecionarem para `/app/assinar` quando o tier for `readonly` (FR-025b)
- [ ] T061 [P] [US2] Criar `frontend-next/src/app/(app)/app/assinar/page.tsx` com a proposta de valor e o botão que chama `createCheckoutSession`
- [ ] T062 [P] [US2] Criar `frontend-next/src/app/(app)/app/conta/page.tsx` exibindo estado da assinatura, data de término do acesso e botão para o Customer Portal (FR-024)
- [ ] T063 [US2] Criar `frontend-next/src/app/api/cron/trial-warnings/route.ts` protegido por `Authorization: Bearer $CRON_SECRET`, com as **duas varreduras** de [contracts/http-routes.md](./contracts/http-routes.md): trials em D-3/D-1 gravando `trial_warned_at`, e contas `past_due` em D-2 recebendo o aviso de suspensão iminente gravando `suspensao_avisada_em` — quem já tem o marcador é pulado (FR-023, FR-025a, R8)
- [ ] T064 [US2] Garantir que as mensagens de negação em `requireFullAccess` incluam caminho direto para assinar e que cada negação gere `access_denied` em `audit_log` (US2-5, FR-030)

**Checkpoint**: produto vendável — pagamento confirmado libera acesso sozinho e cada estado de assinatura tem comportamento verificado.

---

## Phase 5: User Story 3 — Levar os dados embora (P3)

**Goal**: exportar os lançamentos em planilha a qualquer momento, inclusive
depois de cancelar.

**Independent Test**: com uma obra populada, acionar a exportação e abrir o
arquivo em um editor de planilhas; repetir com a conta em `readonly` — cenários
V3 do [quickstart.md](./quickstart.md).

**Depends on**: Fase 3 (há o que exportar). Independente da Fase 4.

- [ ] T065 [P] [US3] Implementar `frontend-next/src/lib/csv.ts`: BOM UTF-8, separador `;`, escape de `;`, `"` e quebra de linha, datas `dd/MM/yyyy`, decimal com vírgula e rótulos em português (R11)
- [ ] T066 [P] [US3] Escrever `frontend-next/tests/unit/csv.test.ts` cobrindo BOM presente, acentuação de "Mão de Obra", item contendo `;` e `"`, valor negativo de diferença e obra sem lançamentos (só cabeçalho)
- [ ] T067 [US3] Criar `frontend-next/src/app/api/obras/[id]/export/route.ts` exigindo sessão e posse da obra mas **não** o tier `full`, com `Content-Disposition: attachment` e `404` para obra de outro usuário (FR-026, FR-027)
- [ ] T068 [P] [US3] Adicionar o botão de exportação no painel da obra e em `/app/conta`, visível também em `readonly` (FR-027)
- [ ] T069 [US3] Escrever `frontend-next/tests/integration/export.test.ts`: exportação funciona com assinatura `expired` e retorna `404` para obra de outro usuário (SC-007, FR-029)

**Checkpoint**: a promessa que substitui o "acesso vitalício" está cumprida e testada.

---

## Phase 6: User Story 4 — Encontrar e entender o produto (P4)

**Goal**: preservar o tráfego orgânico e alinhar a comunicação ao novo
entregável.

**Independent Test**: percorrer as rotas públicas confirmando acessibilidade,
indexabilidade e que nenhuma URL indexada quebrou — cenários V4 do
[quickstart.md](./quickstart.md).

**Depends on**: Fases 3 e 4 (a página só tem o que vender depois que app e
assinatura existem).

- [ ] T070 [P] [US4] Atualizar `frontend-next/src/app/robots.ts` com `disallow` de `/app`, `/entrar`, `/cadastrar`, `/recuperar-senha`, `/redefinir-senha` e `/api` (FR-033)
- [ ] T071 [P] [US4] Revisar `frontend-next/src/app/sitemap.ts` e confirmar que lista **apenas** rotas públicas, sem nenhuma rota de `/app`
- [ ] T072 [US4] Reescrever `frontend-next/src/components/Pricing.tsx`: substituir o link de checkout único da Kiwify por CTA de cadastro com trial, e a cópia passa a descrever app + assinatura recorrente (FR-034)
- [ ] T073 [P] [US4] Revisar a cópia da home e de `/sobre` removendo qualquer promessa de planilha como entregável, mantendo o structured data verificável (FR-034, Princípio II)
- [ ] T074 [US4] Verificar com `curl -I` que todas as URLs previamente indexadas respondem **200 sem redirect**, e conferir `<meta name="robots" content="noindex">` no HTML de `/app` (FR-031, FR-032, SC-008)

**Checkpoint**: canal de aquisição preservado e alinhado ao novo produto.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T075 [P] Criar a página pública de política de retenção e privacidade declarando exatamente o que o sistema faz (ver [data-model.md](./data-model.md) § Retenção): dados mantidos até o titular pedir exclusão, exclusão a pedido imediata e irreversível — **sem prometer expurgo automático nem aviso prévio**, que não existem nesta versão (FR-028)
- [ ] T076 Implementar `deleteAccount` em `frontend-next/src/server/actions/auth.ts` com reconfirmação de senha, `DELETE FROM users` cascateado e registro `account_deleted` em `audit_log` (FR-028)
- [ ] T077 [P] Popular uma obra de teste com 500 lançamentos e medir: as queries agregadas do painel devem responder em **< 200 ms (p95)** e o painel atingir **LCP < 2,5 s** em 3G rápido; ajustar índices só se algum limite for estourado (SC-009)
- [ ] T078 [P] Revisar responsividade do app em viewport de celular — o uso majoritário é celular durante a obra (Assumptions)
- [ ] T079 [P] Adicionar o comentário `ponytail:` em `frontend-next/src/server/actions/lancamentos.ts` registrando a ausência deliberada de locking otimista e o caminho de upgrade (R13)
- [ ] T080 Confirmar `sslmode=require` na `DATABASE_URL` de produção e o TLS habilitado no Postgres auto-hospedado, **antes do primeiro cadastro real** (R17, Princípio V)
- [ ] T081 Cadastrar o webhook de produção no Stripe apontando para o domínio final, configurar a retry/dunning policy com **7 dias de tolerância** antes do cancelamento automático (FR-023) e definir todas as variáveis de ambiente na Vercel
- [ ] T082 Remover o diretório `frontend/` (protótipo Lovable) do repositório (FR-035, Princípio III)
- [ ] T083 Remover `frontend-next/scripts/create-spreadsheet.ts`, `populate-spreadsheet.ts`, `test-sheets.ts` e `diagnose-permissions.ts` (FR-035)
- [ ] T084 Remover as dependências `googleapis` e `google-auth-library` de `frontend-next/package.json` e confirmar que o build passa (FR-035)
- [ ] T085 Atualizar `docs/VISAO-GERAL-DO-PROJETO.md`, que ainda descreve o produto como landing page de planilha com checkout Kiwify
- [ ] T086 Rodar o checklist final de merge do [quickstart.md](./quickstart.md): `npm test`, `npm run build`, `npm run lint`, V1-isolamento manual, e conferência de sitemap e structured data
- [ ] T087 [P] Instrumentar no GA4 os eventos `obra_criada`, `lancamento_criado` e `assinatura_concluida`, sem os quais SC-003 e SC-011 não têm como ser medidos após o lançamento
- [ ] T088 Rodar um teste de usabilidade com 3–5 pessoas do público-alvo antes do lançamento, cronometrando os três critérios com prazo: primeiro gasto em < 5 min (SC-001), gasto adicional em < 30 s (SC-002) e leitura da situação do orçamento em < 15 s (SC-004)

---

## Dependencies

```text
Phase 1 (Setup)
   ↓
Phase 2 (Foundational) ← bloqueia tudo
   ↓
Phase 3 (US1, P1) ────────────── MVP
   ↓            ↘
Phase 4 (US2)    Phase 5 (US3)   ← US3 não depende de US2
   ↘            ↙
    Phase 6 (US4)
        ↓
    Phase 7 (Polish)
```

**Dentro da Fase 2**: T011 → T012–T014 → T015. As tasks de lógica pura
(T016–T021) não dependem do banco e podem correr em paralelo com o schema.
T022–T031 dependem de T015.

**Cruzando fases**: T005 (Fase 1) só é **executável** após T015 — o arquivo pode
ser escrito antes, mas a suíte de teste não roda sem a primeira migração.

**Dentro da Fase 3**: T032–T034 (queries) → T035 (schemas) → T036–T037 (actions)
→ T038–T049 (UI). T050–T051 dependem das queries e actions.

**Dentro da Fase 4**: T052 → T053 → T053a → T054 → T055 → T056 → T057. T058
depende de T053a e T056. UI (T059–T064) depende de T053. T063 depende das colunas
criadas em T014.

**US3 é independente de US2**: pode ser entregue logo após a Fase 3 se a
prioridade mudar.

## Parallel Execution Examples

**Fase 1** — T003, T004, T005, T006, T007, T008 em paralelo (arquivos distintos).

**Fase 2** — dois blocos simultâneos:
- Banco: T011 → T012 → T013 → T014 → T015
- Lógica pura: T016 ∥ T018, depois T017 ∥ T019

**Fase 3 (US1)** — T032, T033, T034 em paralelo; depois T040, T042, T043, T044 e
T046 em paralelo (componentes independentes).

**Fase 5 (US3)** — T065 ∥ T066 (implementação e teste em arquivos distintos).

**Fase 6 (US4)** — T070, T071, T073 em paralelo.

**Fase 7** — T075, T077, T078, T079, T087 em paralelo.

## Implementation Strategy

**MVP = Fases 1 + 2 + 3** (T001–T051). Ao fim da Fase 3 o produto já entrega o
valor central: substitui a planilha, com isolamento entre contas testado. Não é
vendável ainda — toda conta vive do trial —, mas é demonstrável e validável com
usuários reais.

**Incremento 2 = Fase 4** (T052–T064): torna o produto vendável. É a fase com
maior risco de corretude (SC-005 e SC-010 exigem zero incidente), por isso os
nove cenários de webhook de T058 são obrigatórios antes do merge.

**Incremento 3 = Fase 5** (T065–T069): fecha a promessa de portabilidade. Barato
e independente — pode ser antecipado se surgir objeção de venda sobre "perder os
dados".

**Incremento 4 = Fase 6** (T070–T074): protege o canal de aquisição. Só faz
sentido depois que há app e assinatura para descrever.

**Fase 7** encerra a migração. T082–T084 (remoção do legado) só depois que tudo
acima estiver verde — é o commit que torna a virada irreversível. T087 (eventos
GA4) e T088 (teste de usabilidade) são o que dá como medir SC-001 a SC-004,
SC-003 e SC-011 depois do lançamento; sem eles, esses critérios ficam declarados
e não verificáveis.
