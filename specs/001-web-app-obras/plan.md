# Implementation Plan: Web App de Controle Financeiro de Obras

**Branch**: `001-web-app-obras` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-web-app-obras/spec.md`

## Summary

Substituir a planilha Google Sheets por um web app autenticado de controle
financeiro de obras com assinatura recorrente, dentro do codebase Next.js que
hoje só serve a landing page e o blog.

Abordagem: um único deploy Vercel. `frontend-next/` ganha Auth.js v5 com
credenciais sobre Postgres, acesso a dados via Drizzle com migrações versionadas,
mutações em Server Actions e leituras agregadas em SQL dentro de Server
Components. A cobrança recorrente é Stripe (Checkout + Customer Portal +
webhook), com o trial de 14 dias sem cartão gerenciado no nosso banco. Todo
acesso pago é decidido no servidor por uma função `getAccess()` que lê a
assinatura persistida — nunca por estado do cliente. As rotas públicas existentes
entram num route group `(public)` e mantêm as URLs intactas; o app vive sob
`/app` com `noindex`.

Nenhum serviço novo, nenhuma fila, nenhum cache: um Next.js, um Postgres, um
provedor de cobrança e um de e-mail.

## Technical Context

**Language/Version**: TypeScript 5, Node 20+ (runtime `nodejs` nas rotas que
tocam banco ou Stripe)

**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind 3 +
shadcn/ui, Zod 4, React Hook Form, Recharts — já instalados. Novas: `next-auth@5`
+ `@auth/drizzle-adapter`, `drizzle-orm` + `drizzle-kit`, `postgres`, `bcryptjs`,
`stripe`, `resend`, `vitest`. Removidas ao fim: `googleapis`,
`google-auth-library` (FR-035)

**Storage**: Postgres auto-hospedado, `sslmode=require` (R17). Schema único em
`src/db/schema.ts`, migrações SQL versionadas e reversíveis em
`src/db/migrations/`. Dinheiro em centavos (`integer`)

**Testing**: Vitest — unitários para cálculo financeiro, CSV e tabela de acesso;
integração contra `DATABASE_URL_TEST` para escopo por usuário, webhook e trial
único (R16)

**Target Platform**: Vercel (serverless, região `gru1`); navegadores modernos,
uso majoritário em celular

**Project Type**: Web application — Next.js full-stack, frontend e backend no
mesmo projeto

**Performance Goals**: em obra com 500 lançamentos, as queries agregadas do
painel respondem em **< 200 ms (p95)** e o painel atinge **LCP < 2,5 s** em 3G
rápido — é a leitura numérica de "sem espera perceptível" do SC-009. Registrar um
gasto em menos de 30 s (SC-002)

**Constraints**: nenhum serviço além de Postgres, Stripe, Resend, GA4 e Search
Console; sem fila, cache distribuído ou worker; agendamento limitado a um Vercel
Cron diário; rotas públicas indexadas não podem mudar de URL (FR-031, FR-032)

**Scale/Scope**: uso individual, centenas de contas na primeira fase; 11 páginas
novas + 4 Route Handlers, 10 tabelas, 14 Server Actions

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1.*

| Princípio | Avaliação inicial | Após Fase 1 |
|-----------|-------------------|-------------|
| **I. Minimal Backend, Single Deploy** | PASS — Server Actions e Route Handlers contra Postgres no mesmo deploy. Sem microsserviço, fila ou cache. Drizzle é ORM leve, sem engine em runtime (R9) | PASS — design não introduziu nenhuma infra adicional; único agendamento é um Vercel Cron para os avisos de trial (R8) |
| **II. SEO & Content Integrity** | PASS — route group `(public)` preserva todas as URLs; `robots`/`sitemap` mantidos e estendidos (R14) | PASS — zero redirect necessário, `noindex` duplo nas áreas autenticadas, structured data inalterado |
| **III. Single Codebase, Single Deploy** | PASS — tudo em `frontend-next/`; `frontend/` e os scripts de planilha são removidos (FR-035, R15) | PASS — nenhum artefato de design aponta para fora de `frontend-next/` |
| **IV. Subscription State is the Access Source of Truth** | PASS — `getAccess()` lê `subscriptions` no servidor; tabela-verdade de degradação documentada (R4) | PASS — webhook é o **único** escritor de estado de acesso; middleware verifica só sessão, nunca tier |
| **V. Credential & Customer Data Safety** | PASS *condicionado* — segredos só em `.env.local`/Vercel; `sslmode=require` resolve `TODO(SSL_ENFORCEMENT)` (R17). Toda query de obra escopada ao usuário (FR-029) | PASS — `lancamentos` sem `user_id` força o join escopado por construção; V1-isolamento é checagem obrigatória de merge |
| **VI. Data Ownership & Portability** | PASS — exportação CSV disponível inclusive em `readonly` (R11); política de retenção declarada (FR-028) | PASS — rota de exportação exige sessão e posse, **não** tier `full` |

**`TODO(BILLING_PROVIDER)`**: resolvido — Stripe (R1).
**`TODO(SSL_ENFORCEMENT)`**: resolvido no design — `sslmode=require` em todo
ambiente com dado real; a habilitação de TLS no servidor Postgres é pré-requisito
de implementação, rastreada no checklist de merge do `quickstart.md`.

**Violações a justificar**: nenhuma. Seção Complexity Tracking vazia.

## Project Structure

### Documentation (this feature)

```text
specs/001-web-app-obras/
├── plan.md              # Este arquivo
├── spec.md              # Especificação da feature
├── research.md          # Fase 0 — 17 decisões técnicas
├── data-model.md        # Fase 1 — schema Postgres e entidades
├── quickstart.md        # Fase 1 — setup e cenários de validação
├── contracts/           # Fase 1
│   ├── server-actions.md
│   ├── http-routes.md
│   └── stripe-webhook.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 — gerado por /speckit-tasks
```

### Source Code (repository root)

```text
frontend-next/
├── src/
│   ├── app/
│   │   ├── (public)/                    # URLs INALTERADAS (route group não entra no path)
│   │   │   ├── page.tsx                 # home (movida)
│   │   │   ├── blog/                    # movida
│   │   │   └── sobre/                   # movida
│   │   ├── (auth)/                      # noindex
│   │   │   ├── entrar/
│   │   │   ├── cadastrar/
│   │   │   ├── recuperar-senha/
│   │   │   └── redefinir-senha/[token]/
│   │   ├── (app)/app/                   # protegido + noindex
│   │   │   ├── page.tsx                 # seletor de obras
│   │   │   ├── obras/nova/
│   │   │   ├── obras/[id]/              # painel
│   │   │   ├── obras/[id]/lancamentos/
│   │   │   ├── obras/[id]/editar/
│   │   │   ├── conta/
│   │   │   └── assinar/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── stripe/webhook/route.ts
│   │   │   ├── obras/[id]/export/route.ts
│   │   │   └── cron/trial-warnings/route.ts
│   │   ├── layout.tsx, globals.css, robots.ts, sitemap.ts, not-found.tsx
│   ├── db/
│   │   ├── schema.ts                    # fonte única do schema (Drizzle)
│   │   ├── index.ts                     # conexão
│   │   ├── migrations/                  # NNNN_*.sql + NNNN_*.down.sql
│   │   └── queries/                     # leituras escopadas: obras, lancamentos, painel
│   ├── server/
│   │   └── actions/                     # auth, obras, lancamentos, assinatura
│   ├── lib/
│   │   ├── auth.ts                      # Auth.js v5 + adapter Drizzle
│   │   ├── access.ts                    # getAccess / requireUser / requireFullAccess
│   │   ├── money.ts                     # centavos: parse, soma, formatação pt-BR
│   │   ├── calc.ts                      # derivados de obra e lançamento (puro)
│   │   ├── csv.ts                       # exportação
│   │   ├── stripe.ts                    # cliente + mapa de status
│   │   ├── email.ts                     # Resend + templates
│   │   └── utils.ts                     # existente
│   ├── components/                      # existentes + UI do app
│   ├── data/                            # blog-posts.ts (existente)
│   └── middleware.ts                    # protege /app/*
├── tests/
│   ├── unit/                            # calc, money, csv, access
│   └── integration/                     # escopo por usuário, webhook, trial
├── drizzle.config.ts
├── vitest.config.ts
├── vercel.json                          # cron diário
└── package.json

# Removidos ao fim da migração (FR-035):
#   frontend/                            protótipo Lovable
#   frontend-next/scripts/*spreadsheet*  provisionamento manual da planilha
```

**Structure Decision**: projeto único full-stack em `frontend-next/`, conforme o
Princípio III — não há separação `backend/` + `frontend/`. A divisão de camadas é
por diretório dentro de `src/`: `db/` (schema, migrações e leituras escopadas),
`server/actions/` (mutações), `lib/` (lógica pura e integrações) e `app/` (rotas
e UI). Os route groups `(public)`, `(auth)` e `(app)` separam regimes de
autenticação e indexação **sem alterar nenhuma URL existente**.

## Complexity Tracking

> Nenhuma violação da constitution a justificar. Seção intencionalmente vazia.
