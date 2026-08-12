# Implementation Plan: Endurecimento, Conversão e Profundidade do App de Obras

**Branch**: `002-melhorias-v11` | **Date**: 2026-08-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-melhorias-v11/spec.md`

## Summary

Fechar os 14 achados da auditoria da v1.0 já em produção, em três frentes: risco
operacional (US1), conversão do teste em assinatura (US2) e profundidade de
produto (US3).

Abordagem: **nenhum serviço externo novo**. A spec previa uma dependência nova
(captura de erro de servidor) e ela foi resolvida com capacidade nativa — o hook
`onRequestError` de `instrumentation.ts`, que o Next 16 já expõe, grava numa
tabela `incidents` no Postgres e dispara e-mail pelo Resend que já está
integrado. Rate limit de autenticação também mora no Postgres, sem Redis. O
relatório apresentável é uma rota HTML com `@media print`, sem biblioteca de PDF.
O saldo de integrações externas do produto continua exatamente o que era: Stripe,
Resend, GA4 e Search Console.

O trabalho concentra-se em quatro camadas já existentes: `src/db/schema.ts`
(quatro tabelas novas e duas colunas), `src/lib/` (incidents, rate limit),
`src/server/actions/` (parcelamento, arquivar, exclusão de conta) e as páginas de
`src/app/(app)/`. Duas correções de infraestrutura fecham US1: o pool do
`postgres.js` passa a ser dimensionado para serverless, e um segundo Vercel Cron
funciona como dead man's switch do primeiro.

## Technical Context

**Language/Version**: TypeScript 5, Node 20+ (runtime `nodejs` em tudo que toca
banco, Stripe ou `instrumentation`)

**Primary Dependencies**: as mesmas de 001 — Next.js 16, React 19, Tailwind +
shadcn/ui, Drizzle + `postgres`, `next-auth@5`, `stripe`, `resend`, Zod, React
Hook Form, Recharts, Vitest. **Nenhuma dependência nova em toda a feature.**

**Storage**: Postgres auto-hospedado, `sslmode=disable` (Princípio V). Quatro
tabelas novas (`incidents`, `heartbeats`, `auth_attempts`, `parcelamentos`) e
duas colunas novas (`obras.exemplo`, `lancamentos.parcelamento_id` +
`lancamentos.parcela_num`). Migrações versionadas e reversíveis em
`src/db/migrations/`, seguindo o par `NNNN_nome.sql` / `NNNN_nome.down.sql`

**Testing**: Vitest. Unitários para distribuição de parcelas, fingerprint de
incidente, janela de rate limit e agregação da evolução; integração contra
`DATABASE_URL_TEST` para exclusão de conta, rate limit e o funil completo
(FR-032). O funil roda também em GitHub Actions com `postgres:16` como service
container e chaves Stripe de teste

**Target Platform**: Vercel (serverless, `gru1`); uso majoritário em celular

**Project Type**: Web application — Next.js full-stack, um único deploy

**Performance Goals**: obra com 500 lançamentos navega e gera relatório em
**< 2 s por operação** (SC-009); primeiro gasto salvo em **< 3 min** por pessoa
recém-cadastrada no celular (SC-005); falha no caminho do dinheiro comunicada em
**≤ 15 min** (SC-001) — atingido por e-mail no próprio ponto da falha, não por
varredura agendada

**Constraints**: 50 sessões simultâneas sem falha por esgotamento de conexão
(SC-003); nenhuma integração externa nova (Princípio I e seção *Technology &
Integration Constraints*); telemetria não pode carregar segredo nem valor
financeiro de cliente (Princípio V); rotas públicas indexadas e structured data
não podem degradar (Princípio II)

**Scale/Scope**: centenas de contas, dezenas de sessões concorrentes; 3 páginas
novas (`/app/comecar`, `/app/obras/arquivadas`, `/app/obras/[id]/relatorio`),
2 Route Handlers novos, ~6 Server Actions novas ou alteradas

## Constitution Check

*GATE: passou antes da Fase 0 e repassou depois da Fase 1.*

| Princípio | Avaliação |
|-----------|-----------|
| I. Minimal Backend, Single Deploy | **Passa.** Zero dependência nova, zero serviço novo. Rate limit e incidentes no Postgres que já existe; alerta pelo Resend que já existe; relatório em HTML sem lib de PDF. O único acréscimo de infra é um segundo Vercel Cron — mesmo mecanismo do cron que já roda. |
| II. SEO & Content Integrity | **Passa.** Nada aqui toca route group `(public)`, sitemap, robots ou `schema-markup.tsx`. As três páginas novas ficam sob `/app`, já `noindex` pelo layout. |
| III. Single Codebase, Single Deploy | **Passa.** Tudo em `frontend-next/`. `frontend/` não é tocado. |
| IV. Subscription State is the Access Source of Truth | **Passa.** O relatório (FR-031) e a exportação são liberados para `readonly` por decisão explícita de produto, ainda derivada de `getAccess()` no servidor. Arquivar obra não altera acesso (FR-028) — `getAccess()` não lê `obras`, e um teste passa a fixar isso. |
| V. Credential & Customer Data Safety | **Passa, e é o princípio mais exercitado aqui.** `recordIncident()` herda a lista de chaves proibidas de `logAudit` e grava apenas rota, `userId`, tipo e mensagem do erro — nunca `item`, `fornecedor` ou valor. `auth_attempts` guarda hash do e-mail, nunca a credencial tentada. Exclusão de conta mantém no audit apenas o evento, sem dado pessoal (FR-012). |
| VI. Data Ownership & Portability | **Passa e avança.** O relatório é a segunda forma de portabilidade e segue o mesmo direito da exportação (FR-031). FR-011 obriga avisar sobre a perda irreversível antes de excluir a conta. |

Nenhuma violação. **Complexity Tracking fica vazio.**

## Project Structure

### Documentation (this feature)

```text
specs/002-melhorias-v11/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — as 8 decisões e o que foi rejeitado
├── data-model.md        # Fase 1 — tabelas e colunas novas
├── quickstart.md        # Fase 1 — como validar cada história
├── contracts/
│   ├── incidents.md     # contrato de captura e notificação de falha
│   ├── rate-limit.md    # contrato de limite de tentativas
│   └── server-actions.md# actions novas e alteradas
├── checklists/
│   └── requirements.md  # já existente, aprovado
├── spec.md
└── tasks.md             # Fase 2 — NÃO criado por /speckit-plan
```

### Source Code (repository root)

```text
frontend-next/
├── src/
│   ├── instrumentation.ts                      # NOVO — onRequestError (FR-001)
│   ├── db/
│   │   ├── index.ts                            # ALTERADO — pool serverless (FR-008)
│   │   ├── schema.ts                           # ALTERADO — 4 tabelas, 3 colunas
│   │   ├── migrations/0003_*.sql / .down.sql   # NOVO
│   │   └── queries/
│   │       ├── painel.ts                       # ALTERADO — evolucaoConsumo (FR-023)
│   │       ├── lancamentos.ts                  # ALTERADO — filtro de exemplo (FR-015)
│   │       └── obras.ts                        # ALTERADO — arquivadas (FR-026)
│   ├── lib/
│   │   ├── incidents.ts                        # NOVO — recordIncident + fingerprint
│   │   ├── rate-limit.ts                       # NOVO — janela fixa no Postgres
│   │   ├── email.ts                            # ALTERADO — e-mail de incidente
│   │   ├── audit.ts                            # ALTERADO — evento rate_limited
│   │   └── parcelas.ts                         # NOVO — distribuição sem resto (FR-019)
│   ├── server/
│   │   ├── actions/
│   │   │   ├── auth.ts                         # ALTERADO — rate limit, delete + Stripe
│   │   │   ├── obras.ts                        # ALTERADO — arquivar/desarquivar, exemplo
│   │   │   └── lancamentos.ts                  # ALTERADO — parcelamento
│   │   └── stripe/webhook.ts                   # ALTERADO — recordIncident no unmatched
│   ├── app/
│   │   ├── (app)/app/
│   │   │   ├── comecar/page.tsx                # NOVO — caminho guiado (FR-013)
│   │   │   ├── conta/page.tsx                  # ALTERADO — excluir conta (FR-009)
│   │   │   ├── obras/arquivadas/page.tsx       # NOVO (FR-027)
│   │   │   └── obras/[id]/
│   │   │       ├── page.tsx                    # ALTERADO — evolução (FR-023)
│   │   │       ├── relatorio/page.tsx          # NOVO (FR-030)
│   │   │       └── lancamentos/page.tsx        # ALTERADO — paginação (FR-029)
│   │   └── api/cron/
│   │       ├── trial-warnings/route.ts         # ALTERADO — heartbeat + try/catch
│   │       └── watchdog/route.ts               # NOVO — dead man's switch (FR-003)
│   └── components/app/
│       ├── lancamento-form.tsx                 # ALTERADO — data nativa, máscara, parcelas
│       ├── conta-delete-dialog.tsx             # NOVO (FR-009, FR-011)
│       ├── grafico-evolucao.tsx                # NOVO (FR-023, FR-024)
│       └── paginacao.tsx                       # NOVO (FR-029)
├── tests/
│   ├── unit/          # parcelas, fingerprint, rate limit, evolução
│   └── integration/   # exclusão de conta, rate limit, funil completo
└── vercel.json                                 # ALTERADO — cron do watchdog

.github/workflows/ci.yml                        # NOVO — roda o funil (FR-032)
```

**Structure Decision**: mantida a estrutura de 001 sem exceção. Toda mutação
continua em Server Action, toda leitura em query de `src/db/queries/` chamada de
Server Component, e todo Route Handler novo fica sob `src/app/api/`. As três
páginas novas entram no route group `(app)` existente e herdam dele o `noindex`
e a checagem de sessão.

## Complexity Tracking

Sem violações de Constitution Check. Tabela intencionalmente vazia.
