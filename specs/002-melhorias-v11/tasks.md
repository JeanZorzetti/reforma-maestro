---

description: "Task list for feature implementation"
---

# Tasks: Endurecimento, Conversão e Profundidade do App de Obras

**Input**: Design documents from `/specs/002-melhorias-v11/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: incluídos. A spec pede verificação automatizada explicitamente
(FR-032, SC-010) e o plan.md fixa a matriz de testes (unitários para parcelas,
fingerprint, rate limit e evolução; integração para exclusão de conta, rate
limit, concorrência e funil completo).

**Organization**: tarefas agrupadas por user story, para implementar e validar
cada história de forma independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1, US2, US3
- Caminhos relativos à raiz do repositório

## Path Conventions

Web app Next.js único em `frontend-next/`. Código em `frontend-next/src/`,
testes em `frontend-next/tests/`. `frontend/` não é tocado (Princípio III).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar ambiente para a migração e o novo canal de alerta. Nenhuma
dependência nova é instalada nesta feature.

- [X] T001 Adicionar `INCIDENT_EMAIL` (sem default) em `frontend-next/.env.local` e documentar a variável no `frontend-next/README.md`, registrando que a ausência desliga o envio mas não o registro do incidente
- [X] T002 [P] Provisionar `INCIDENT_EMAIL` e confirmar `CRON_SECRET` nas Environment Variables do projeto na Vercel (produção e preview)
- [X] T003 [P] Confirmar que `npm test` e `npm run build` passam na base atual em `frontend-next/`, estabelecendo o baseline verde antes de qualquer alteração

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema e tipos compartilhados por US1 e US2. A migração é única
(`0003_melhorias_v11`), então nenhuma história pode começar antes dela.

**⚠️ CRITICAL**: nenhuma tarefa de US1, US2 ou US3 começa antes do checkpoint desta fase

- [X] T004 Declarar em `frontend-next/src/db/schema.ts` os enums `incident_kind` (`server_error`, `webhook_failed`, `cron_failed`, `cron_missing`) e `periodicidade` (`mensal`, `quinzenal`, `semanal`)
- [X] T005 Declarar em `frontend-next/src/db/schema.ts` as tabelas `incidents` (PK `fingerprint`, `kind`, `route`, `message`, `detail` jsonb default `{}`, `count` default 1, `first_seen_at`, `last_seen_at`, `notified_at` nullable) e `heartbeats` (PK `name`, `last_run_at`), com índice `incidents_notified_at_idx` em `(notified_at, last_seen_at)` (depende de T004)
- [X] T006 Declarar em `frontend-next/src/db/schema.ts` a tabela `auth_attempts` (PK `key`, `window_start`, `count` default 0)
- [X] T007 Declarar em `frontend-next/src/db/schema.ts` a tabela `parcelamentos` (PK `id` uuid, `obra_id` → `obras.id` ON DELETE CASCADE, `total_cents` CHECK > 0, `parcelas` CHECK BETWEEN 2 AND 60, `periodicidade`, `created_at`) (depende de T004)
- [X] T008 Adicionar em `frontend-next/src/db/schema.ts` a coluna `obras.exemplo` (`boolean not null default false`), a coluna `lancamentos.parcelamento_id` (`uuid` nullable → `parcelamentos.id` ON DELETE SET NULL), a coluna `lancamentos.parcela_num` (`integer` nullable) com `CHECK ((parcela_num IS NULL) = (parcelamento_id IS NULL))` e o índice `lancamentos_parcelamento_id_idx` (depende de T007)
- [X] T009 Escrever `frontend-next/src/db/migrations/0003_melhorias_v11.sql` com tudo de T004–T008 e o par reversível `frontend-next/src/db/migrations/0003_melhorias_v11.down.sql`, seguindo o padrão de 001 (depende de T005, T006, T007, T008)
- [X] T010 Aplicar a migração com `npm run db:migrate` em `frontend-next/` e conferir o rollback do `.down.sql` num banco de teste antes de considerar a fase fechada (depende de T009)
- [X] T011 [P] Acrescentar os erros `MUITAS_TENTATIVAS` e `STRIPE_INDISPONIVEL` ao `ActionResult` em `frontend-next/src/server/actions/types.ts`
- [X] T012 [P] Acrescentar o evento `rate_limited` ao tipo `AuditEvent` em `frontend-next/src/lib/audit.ts` e exportar a lista `FORBIDDEN_KEYS` para reuso por `recordIncident()`

**Checkpoint**: schema aplicado e reversível, tipos compartilhados prontos — US1, US2 e US3 podem começar em paralelo

---

## Phase 3: User Story 1 - Operar sem falhar em silêncio (Priority: P1) 🎯 MVP

**Goal**: falha no caminho do dinheiro comunicada em ≤ 15 min, autenticação com
limite de tentativas, banco que aguenta concorrência e direito de exclusão de
conta funcionando com cancelamento da cobrança.

**Independent Test**: forçar falha de webhook e confirmar o e-mail de alerta;
errar a senha 11 vezes e receber recusa com prazo; rodar o teste de concorrência
de 50 requisições; excluir uma conta de teste com assinatura ativa e confirmar
dados apagados e cobrança cancelada. Nenhuma tela nova de produto é necessária.

### Tests for User Story 1 ⚠️

> Escrever primeiro e confirmar que falham antes de implementar

- [ ] T013 [P] [US1] Teste unitário do fingerprint de incidente em `frontend-next/tests/unit/incidents.test.ts`: mesma mensagem com UUIDs e números diferentes normaliza para o mesmo hash; `kind` ou `route` diferente gera hash diferente
- [ ] T014 [P] [US1] Teste unitário da janela de rate limit em `frontend-next/tests/unit/rate-limit.test.ts`: limite por escopo, `retryAfterSeconds` calculado a partir de `window_start`, e reinício da janela após expirar
- [ ] T015 [P] [US1] Teste de integração de rate limit em `frontend-next/tests/integration/rate-limit.test.ts`: 11ª tentativa de login recusada com `MUITAS_TENTATIVAS`; sucesso após `clearAttempts`; `requestPasswordReset` retorna resposta idêntica antes e depois do limite e para de enviar e-mail; `audit_log` recebe `rate_limited` sem e-mail nem hash no `detail`
- [ ] T016 [P] [US1] Teste de integração de concorrência em `frontend-next/tests/integration/concorrencia.test.ts`: 50 leituras simultâneas contra `DATABASE_URL_TEST` sem nenhum erro de conexão
- [ ] T017 [P] [US1] Teste de integração de exclusão de conta em `frontend-next/tests/integration/exclusao-conta.test.ts`: senha errada não apaga nada; falha do Stripe aborta com `STRIPE_INDISPONIVEL` deixando a conta íntegra; sucesso apaga obras e lançamentos e deixa `audit_log` com `account_deleted` e `user_id NULL`

### Implementation for User Story 1

- [ ] T018 [P] [US1] Corrigir o pool serverless em `frontend-next/src/db/index.ts` para `postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 10 })` (FR-008, faz T016 passar)
- [ ] T019 [US1] Implementar `frontend-next/src/lib/incidents.ts` com `IncidentKind`, `normalize()`, `fingerprint()` e `recordIncident(kind, route, error, detail)`: UPSERT com `ON CONFLICT (fingerprint)` incrementando `count` e `last_seen_at` antes de qualquer tentativa de envio, validação de `detail` contra `FORBIDDEN_KEYS` (lança só em dev/test), e a função nunca propagando erro (FR-001 a FR-004; faz T013 passar)
- [ ] T020 [US1] Implementar `sendIncidentEmail()` em `frontend-next/src/lib/email.ts` — assunto `[Reforma Maestro] {kind}: {route}`, corpo em texto com tipo, rota, mensagem, `count`, primeira e última ocorrência e `userId` quando houver, destinatário `INCIDENT_EMAIL`, ausência da env var desligando só o envio (depende de T019)
- [ ] T021 [US1] Ligar a janela de silêncio de 30 min em `frontend-next/src/lib/incidents.ts`: notifica se `notified_at IS NULL` ou `now() - notified_at > 30 min`; envio em `try/catch` atualizando `notified_at` só no sucesso (FR-004; depende de T020)
- [ ] T022 [P] [US1] Criar `frontend-next/src/instrumentation.ts` exportando `onRequestError` que chama `recordIncident("server_error", route, error)` com runtime `nodejs` (FR-001; depende de T019)
- [ ] T023 [P] [US1] Chamar `recordIncident("webhook_failed", ...)` no ramo `unmatched` de `frontend-next/src/server/stripe/webhook.ts`, passando `eventId` e `userId` afetado em `detail` e nenhum valor financeiro (FR-002; depende de T019)
- [ ] T024 [P] [US1] Chamar `recordIncident("webhook_failed", ...)` na falha de verificação de assinatura em `frontend-next/src/app/api/stripe/webhook/route.ts` (FR-002; depende de T019)
- [ ] T025 [US1] Envolver o corpo de `frontend-next/src/app/api/cron/trial-warnings/route.ts` em `try/catch` com `recordIncident("cron_failed", ...)` e gravar o heartbeat `trial-warnings` por upsert ao fim da execução bem-sucedida (FR-003; depende de T019)
- [ ] T026 [US1] Criar `frontend-next/src/app/api/cron/watchdog/route.ts` com auth `Bearer CRON_SECRET`, retorno `{ ok, stale }`, incidente `cron_missing` quando o heartbeat passar de 26 h, e reenvio dos incidentes com `notified_at IS NULL` (FR-003; depende de T021, T025)
- [ ] T027 [US1] Registrar o cron `/api/cron/watchdog` em `0 18 * * *` em `frontend-next/vercel.json` (depende de T026)
- [ ] T028 [US1] Implementar `frontend-next/src/lib/rate-limit.ts` com `consumeAttempt(scope, target)` e `clearAttempts(scope, target)` usando o UPSERT atômico de janela fixa do contrato, SHA-256 do alvo aplicado internamente e os limites 10/15min (`login`), 30/15min (`login_ip`) e 5/60min (`reset`) (FR-005, FR-006; faz T014 passar)
- [ ] T029 [US1] Integrar o rate limit em `login` dentro de `frontend-next/src/server/actions/auth.ts`: `consumeAttempt("login", email)` e `consumeAttempt("login_ip", ip)` antes de qualquer consulta a `users`, IP tirado do primeiro valor de `x-forwarded-for` (ausente ⇒ escopo pulado), recusa retornando `MUITAS_TENTATIVAS` + `retryAfterSeconds` com `logAudit(null, "rate_limited", { scope, retryAfterSeconds })`, e `clearAttempts` no sucesso (FR-005, FR-007; depende de T028)
- [ ] T030 [US1] Integrar o rate limit em `requestPasswordReset` dentro de `frontend-next/src/server/actions/auth.ts`, retornando `{ ok: true }` idêntico ao caminho aceito e apenas suprimindo o envio de e-mail (FR-006; depende de T028, faz T015 passar)
- [ ] T031 [US1] Exibir a mensagem de "tente novamente em N minutos" ao receber `MUITAS_TENTATIVAS` em `frontend-next/src/components/app/entrar-form.tsx` (depende de T029)
- [ ] T032 [US1] Alterar `deleteAccount` em `frontend-next/src/server/actions/auth.ts` para cancelar a assinatura no Stripe **antes** de apagar, abortando com `STRIPE_INDISPONIVEL` se o cancelamento falhar, e encerrar a sessão com `signOut({ redirect: false })` depois da exclusão (FR-009, FR-010, FR-012; faz T017 passar)
- [ ] T033 [P] [US1] Criar `frontend-next/src/components/app/conta-delete-dialog.tsx` com confirmação por senha, aviso de que a exportação é irreversivelmente perdida e link para exportar antes de habilitar o botão (FR-009, FR-011)
- [ ] T034 [US1] Montar o fluxo de exclusão em no máximo 3 interações em `frontend-next/src/app/(app)/app/conta/page.tsx`, ligando o diálogo à action (SC-004; depende de T032, T033)

**Checkpoint**: falhas de webhook, cron e servidor alertam em minutos; login e recuperação de senha limitados; 50 sessões simultâneas sem erro de conexão; conta excluível com cobrança cancelada. US1 é entregável sozinha.

---

## Phase 4: User Story 2 - Transformar o teste gratuito em assinatura (Priority: P2)

**Goal**: pessoa recém-cadastrada entende o produto, lança um gasto no celular
sem lutar com o teclado e registra um parcelamento de uma vez só.

**Independent Test**: com uma conta nova, cronometrar do cadastro ao primeiro
gasto salvo num celular real (< 3 min) e registrar um parcelamento em 6 vezes
conferindo as 6 parcelas e a soma exata. Não depende de nada de US1.

### Tests for User Story 2 ⚠️

- [ ] T035 [P] [US2] Teste unitário de `distribuirParcelas` em `frontend-next/tests/unit/parcelas.test.ts`: soma exatamente igual ao total em casos não divisíveis (`1000/3` → `334, 333, 333`), limites 2 e 60 aceitos, fora do intervalo rejeitado

### Implementation for User Story 2

- [ ] T036 [P] [US2] Implementar `distribuirParcelas(totalCents, n)` em `frontend-next/src/lib/parcelas.ts` com base `Math.floor(total / n)` e resto distribuído um centavo por parcela a partir da primeira, mais o cálculo de datas por periodicidade mensal/quinzenal/semanal (FR-019; faz T035 passar)
- [ ] T037 [US2] Alterar o schema Zod de lançamento em `frontend-next/src/server/actions/schemas.ts` para aceitar data em `yyyy-MM-dd` e os campos opcionais `parcelas` (inteiro 2–60) e `periodicidade` (obrigatório quando `parcelas` presente) (FR-016, FR-018, FR-022)
- [ ] T038 [US2] Estender `criarLancamento` em `frontend-next/src/server/actions/lancamentos.ts` para, com `parcelas` presente, inserir o `parcelamento` e os N lançamentos numa única transação com `parcela_num = 1..N` e datas deslocadas pela periodicidade, revalidando painel e lista (FR-018, FR-019; depende de T036, T037)
- [ ] T039 [US2] Criar `excluirSerieParcelamento` em `frontend-next/src/server/actions/lancamentos.ts` com `requireUser()` + `requireFullAccess()`, contagem escopada por join em `obras.user_id` devolvida à UI, e transação apagando lançamentos e a série (FR-021; depende de T038)
- [ ] T040 [US2] Trocar o campo de data por `<input type="date">` nativo com hoje pré-selecionado e aplicar máscara de moeda em reais durante a digitação em `frontend-next/src/components/app/lancamento-form.tsx`, reusando os helpers de `frontend-next/src/lib/money.ts` (FR-016, FR-017)
- [ ] T041 [US2] Adicionar os campos de número de parcelas e periodicidade em `frontend-next/src/components/app/lancamento-form.tsx`, visíveis só quando o gasto for parcelado (FR-018; depende de T037, T040)
- [ ] T042 [US2] Adicionar em `frontend-next/src/components/app/lancamento-row-actions.tsx` a ação de excluir a série inteira, com confirmação informando quantos lançamentos serão removidos (FR-021; depende de T039)
- [ ] T043 [P] [US2] Criar `criarObraExemplo` em `frontend-next/src/server/actions/obras.ts`: obra com `exemplo = true` e lançamentos ilustrativos numa transação, idempotente por usuário (FR-014)
- [ ] T044 [US2] Excluir obras com `exemplo = true` dos indicadores de uso em `frontend-next/src/db/queries/obras.ts` e marcá-las de forma inequívoca na exportação em `frontend-next/src/lib/csv.ts`, mantendo o painel da obra de exemplo funcionando (FR-015; depende de T043)
- [ ] T045 [US2] Criar a página do caminho guiado em `frontend-next/src/app/(app)/app/comecar/page.tsx`, explicando o produto, terminando com a primeira obra criada e oferecendo a obra de exemplo, marcada e removível (FR-013, FR-014; depende de T043)
- [ ] T046 [US2] Redirecionar `signUp` para `/app/comecar` em vez de `/app/obras/nova` em `frontend-next/src/server/actions/auth.ts` (FR-013; depende de T045)

**Checkpoint**: US1 e US2 funcionam de forma independente; primeiro gasto salvo em menos de 3 minutos no celular e parcelamento em um único preenchimento.

---

## Phase 5: User Story 3 - Enxergar o rumo da obra e mostrar isso a alguém (Priority: P3)

**Goal**: evolução do consumo contra o teto, obra concluída fora da lista
principal, obra grande navegável e relatório apresentável.

**Independent Test**: numa obra populada ao longo de vários meses, conferir a
evolução, arquivar e desarquivar, navegar 500+ lançamentos e gerar o relatório —
sem depender de US1 nem de US2.

### Tests for User Story 3 ⚠️

- [ ] T047 [P] [US3] Teste unitário da agregação de evolução em `frontend-next/tests/unit/evolucao.test.ts`: acumulado por mês, separação entre pago (`data <= CURRENT_DATE`) e previsto, e array vazio com menos de 2 meses distintos
- [ ] T048 [P] [US3] Teste de integração em `frontend-next/tests/integration/arquivar.test.ts`: `getAccess()` devolve o mesmo `tier` antes e depois de arquivar, e a obra arquivada continua exportável (FR-028)
- [ ] T049 [P] [US3] Teste de integração do funil em `frontend-next/tests/integration/funil.test.ts`: `createAccount` → `getAccess` (trial) → evento Stripe assinado localmente → `processStripeWebhookEvent` → `getAccess` (full), com chave Stripe de modo teste (FR-032)

### Implementation for User Story 3

- [ ] T050 [P] [US3] Implementar `evolucaoConsumo(userId, obraId)` em `frontend-next/src/db/queries/painel.ts` com `SUM(...) OVER (ORDER BY mes)` para pago e previsto, escopo por join em `obras.user_id` e retorno vazio abaixo de 2 meses distintos (FR-023 a FR-025; faz T047 passar)
- [ ] T051 [P] [US3] Criar `frontend-next/src/components/app/grafico-evolucao.tsx` em Recharts, distinguindo visualmente o trecho pago do previsto e traçando a linha do teto do orçamento (FR-023, FR-024)
- [ ] T052 [US3] Ligar a evolução ao painel em `frontend-next/src/app/(app)/app/obras/[id]/page.tsx`, exibindo a mensagem explicativa quando a série vier vazia em vez de um gráfico degenerado (FR-025; depende de T050, T051)
- [ ] T053 [P] [US3] Criar `arquivarObra` e `desarquivarObra` em `frontend-next/src/server/actions/obras.ts` com `requireUser()` + `requireFullAccess()` e escopo `WHERE id = $1 AND user_id = $2`, sem tocar em `subscriptions` (FR-026, FR-028; faz T048 passar)
- [ ] T054 [P] [US3] Implementar `listObrasArquivadas(userId)` em `frontend-next/src/db/queries/obras.ts` e filtrar `arquivada_em IS NULL` na listagem principal (FR-026, FR-027)
- [ ] T055 [US3] Criar a listagem em `frontend-next/src/app/(app)/app/obras/arquivadas/page.tsx` com a ação de desarquivar (FR-027; depende de T053, T054)
- [ ] T056 [US3] Adicionar a ação de arquivar na página da obra em `frontend-next/src/app/(app)/app/obras/[id]/page.tsx` (FR-026; depende de T053)
- [ ] T057 [P] [US3] Criar `frontend-next/src/components/app/paginacao.tsx` com avançar/voltar e indicação de posição no total ("51–100 de 512"), sem enumerar páginas (FR-029)
- [ ] T058 [US3] Paginar a lista em `frontend-next/src/app/(app)/app/obras/[id]/lancamentos/page.tsx` por `searchParams`, com `LIMIT`/`OFFSET` e `COUNT` na query de `frontend-next/src/db/queries/lancamentos.ts` (FR-029, SC-009; depende de T057)
- [ ] T059 [P] [US3] Implementar `dadosRelatorio(userId, obraId)` em `frontend-next/src/db/queries/obras.ts` reusando as agregações do painel e `listLancamentosParaExport`, sem escrever agregação nova (FR-030)
- [ ] T060 [US3] Criar `frontend-next/src/app/(app)/app/obras/[id]/relatorio/page.tsx` como Server Component **sem** `requireFullAccess()`, reusando `painel-cards.tsx` e `grafico-categorias.tsx`, com estilos `@media print` que escondem a navegação do app e não cortam conteúdo (FR-030, FR-031; depende de T059)
- [ ] T061 [US3] Criar `.github/workflows/ci.yml` rodando `npm test` a cada push com `postgres:16` como service container e chaves Stripe de modo teste (FR-032, SC-010; depende de T049)

**Checkpoint**: as três histórias funcionam de forma independente

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T062 [P] Atualizar `frontend-next/CLAUDE.md` e `frontend-next/AGENTS.md` com as tabelas novas, `recordIncident()` como ponto único de alerta e o par de crons
- [ ] T063 [P] Conferir com `EXPLAIN` que a evolução, a paginação e o relatório de uma obra com 500 lançamentos ficam abaixo de 2 s por operação (SC-009)
- [ ] T064 Reler `detail` gravado em `incidents` e `audit_log` em todos os caminhos novos, confirmando ausência de senha, token, chave, `item`, `fornecedor` e qualquer `*_cents` (Princípio V)
- [ ] T065 Rodar `npm test`, `npm run lint` e `npm run build` em `frontend-next/` com tudo integrado
- [ ] T066 Executar o `quickstart.md` inteiro, incluindo a cronometragem em celular real (SC-005, SC-006) e a conferência de que `/sitemap.xml` e o structured data não regrediram (Princípio II)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências
- **Foundational (Fase 2)**: depende da Fase 1 — **bloqueia todas as histórias**
- **US1 (Fase 3)**, **US2 (Fase 4)**, **US3 (Fase 5)**: dependem só da Fase 2, entre si são independentes
- **Polish (Fase 6)**: depende das histórias que se quer entregar

### User Story Dependencies

- **US1 (P1)**: nenhuma dependência de outra história. É o MVP.
- **US2 (P2)**: independente de US1 no código. A ordem de prioridade é de produto — não faz sentido trazer mais gente para uma operação que falha em silêncio.
- **US3 (P3)**: independente de US1 e US2 no código. T049/T061 (funil) não dependem de nada de US1.

### Within Each User Story

- Testes escritos e falhando antes da implementação
- Migração e schema (Fase 2) antes de qualquer query
- `lib/` antes de actions; actions antes de páginas; queries antes de Server Components
- Em US1, `recordIncident()` (T019) é pré-requisito de todos os chamadores (T022–T026)

### Parallel Opportunities

- T002 e T003 juntas na Fase 1
- T011 e T012 juntas, em paralelo com T004–T010
- T013 a T017 (todos os testes de US1) juntos
- T018, T022, T023, T024 juntos depois de T019
- T047, T048, T049 juntos; depois T050, T051, T053, T054, T057, T059 juntos
- Com três pessoas, US1, US2 e US3 rodam em paralelo depois do checkpoint da Fase 2

---

## Parallel Example: User Story 1

```bash
# Testes de US1 juntos (todos devem falhar antes da implementação):
Task: "Teste unitário do fingerprint em frontend-next/tests/unit/incidents.test.ts"
Task: "Teste unitário da janela de rate limit em frontend-next/tests/unit/rate-limit.test.ts"
Task: "Teste de integração de rate limit em frontend-next/tests/integration/rate-limit.test.ts"
Task: "Teste de concorrência em frontend-next/tests/integration/concorrencia.test.ts"
Task: "Teste de exclusão de conta em frontend-next/tests/integration/exclusao-conta.test.ts"

# Chamadores de recordIncident, depois de T019:
Task: "onRequestError em frontend-next/src/instrumentation.ts"
Task: "recordIncident no ramo unmatched de frontend-next/src/server/stripe/webhook.ts"
Task: "recordIncident na falha de assinatura em frontend-next/src/app/api/stripe/webhook/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Fase 1: Setup
2. Fase 2: Foundational (bloqueia tudo)
3. Fase 3: US1
4. **PARAR E VALIDAR**: seção US1 do `quickstart.md`
5. Deploy — é a frente que trata risco já materializado em produção

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 → validar → deploy (MVP: para de falhar em silêncio)
3. US2 → validar → deploy (ativação e conversão)
4. US3 → validar → deploy (profundidade e apresentação)

### Parallel Team Strategy

Depois do checkpoint da Fase 2: uma pessoa em US1, uma em US2, uma em US3. A
única sobreposição real de arquivo é `src/server/actions/auth.ts` entre T029/T032
(US1) e T046 (US2) — coordenar ou serializar essas três.

---

## Notes

- Nenhuma dependência nova em toda a feature (Princípio I)
- `frontend/` não é tocado (Princípio III); nada em `(public)` é alterado (Princípio II)
- Toda leitura e escrita escopada ao usuário autenticado no servidor (Princípio V)
- `fileParallelism: false` no Vitest continua valendo — o truncate entre casos assume banco único
- Commit por tarefa ou grupo lógico; parar em qualquer checkpoint para validar a história isoladamente
