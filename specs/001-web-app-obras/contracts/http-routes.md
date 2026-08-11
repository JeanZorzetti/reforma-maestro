# Contrato: rotas HTTP e Route Handlers

**Feature**: `001-web-app-obras` | **Fase**: 1

## Rotas públicas — inalteradas (FR-031, FR-032)

Movidas para o route group `(public)`, que **não altera o path**. Nenhum
redirect é necessário e nenhuma URL indexada muda.

| Rota | Origem | Auth | Indexável |
|------|--------|------|-----------|
| `/` | existente | não | sim |
| `/blog`, `/blog/[slug]` | existente | não | sim |
| `/sobre` | existente | não | sim |
| `/sitemap.xml`, `/robots.txt` | existente | não | — |

`Pricing.tsx` troca o link de checkout único da Kiwify por CTA de cadastro, e a
cópia passa a descrever app + assinatura (FR-034). Rota e URL não mudam.

## Rotas de autenticação — novas, `noindex`

| Rota | Descrição |
|------|-----------|
| `/entrar` | login; aceita `?next=` para retomar o destino após sessão expirada |
| `/cadastrar` | criação de conta + início do trial (FR-025) |
| `/recuperar-senha` | solicita o e-mail de reset (FR-002) |
| `/redefinir-senha/[token]` | consome o token de uso único |

## Rotas do app — novas, protegidas e `noindex` (FR-033)

Route group `(app)` sob o prefixo `/app`, protegido por `middleware.ts`.

| Rota | Conteúdo | Tier mínimo |
|------|----------|-------------|
| `/app` | seletor de obras; redireciona ao cadastro se não houver nenhuma | `readonly` |
| `/app/obras/nova` | formulário de criação (FR-004) | `full` |
| `/app/obras/[id]` | painel: totais, saldo, % consumido, quebra por categoria, alerta de estouro (FR-014 a FR-017) | `readonly` |
| `/app/obras/[id]/lancamentos` | lista paginada com filtros de categoria e status (FR-012) | `readonly` |
| `/app/obras/[id]/editar` | edição da obra (FR-006) | `full` |
| `/app/conta` | dados da conta, estado da assinatura, portal, exclusão de dados (FR-024, FR-028) | `readonly` |
| `/app/assinar` | página de conversão para `readonly`, com CTA de checkout | `readonly` |

**Comportamento em `readonly`** (FR-022, FR-025b): as rotas de leitura carregam
normalmente com um banner persistente explicando o estado e linkando `/app/assinar`;
as rotas `full` redirecionam para `/app/assinar`. Nenhum dado é escondido e a
exportação segue disponível.

**Middleware**: sessão ausente em `/app/*` ⇒ `redirect('/entrar?next=<path>')`.
O middleware verifica **apenas sessão**; o `tier` é resolvido no Server Component
ou na action, sempre contra o banco (FR-019) — nunca em cookie ou claim.

**`noindex`**: `robots.ts` ganha `disallow: ['/app', '/entrar', '/cadastrar',
'/recuperar-senha', '/redefinir-senha', '/api']`, e os layouts de `(app)` e
`(auth)` exportam `metadata.robots = { index: false, follow: false }`.

---

## Route Handlers

### `GET /api/obras/[id]/export` — exportação (FR-026, FR-027)

**Auth**: sessão válida + obra pertencente ao usuário. **Não exige tier `full`**
— é justamente o que `readonly` preserva.

**Resposta 200**
```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="obra-<slug>-<YYYY-MM-DD>.csv"
```
Corpo: BOM UTF-8 (`﻿`) + CSV com separador `;`, colunas
`Data;Categoria;Item;Fornecedor;Valor Previsto;Valor Pago;Status;Diferença`,
datas em `dd/MM/yyyy`, valores com vírgula decimal e sem símbolo de moeda,
categorias e status com os rótulos de exibição em português. Campos com `;`,
`"` ou quebra de linha são envolvidos em aspas duplas com escape `""`.

**Erros**: `401` sem sessão; `404` para obra inexistente **ou de outro usuário**
(FR-029). Obra sem lançamentos retorna 200 com apenas o cabeçalho.

### `POST /api/stripe/webhook`
Ver [`stripe-webhook.md`](./stripe-webhook.md).

### `GET|POST /api/auth/[...nextauth]`
Handler do Auth.js v5. Sem contrato próprio.

### `GET /api/cron/trial-warnings` (R8, FR-023, FR-025a)
Disparado por Vercel Cron uma vez ao dia. Exige header
`Authorization: Bearer $CRON_SECRET`; sem ele, `401`. Faz duas varreduras:

1. **Trial expirando** — assinaturas `trialing` com `access_until` em D-3 ou D-1;
   envia o aviso com caminho direto para assinar e grava `trial_warned_at`
   (FR-025a).
2. **Suspensão iminente** — assinaturas `past_due` com `access_until` em D-2;
   envia o aviso de suspensão com instruções de regularização e grava
   `suspensao_avisada_em` (FR-023).

Ambas as varreduras pulam quem já tem o marcador correspondente preenchido — o
cron é idempotente, então rodar duas vezes no mesmo dia não duplica e-mail.

Resposta `200 { trialAvisados: number, suspensaoAvisados: number }`.

---

## Formato de erro dos Route Handlers

```json
{ "error": "CODIGO_ESTAVEL", "message": "Texto em português para exibição" }
```
Códigos: `NAO_AUTENTICADO` (401), `NAO_ENCONTRADO` (404),
`ACESSO_SOMENTE_LEITURA` (403), `ASSINATURA_INVALIDA` (400, webhook),
`ERRO_INTERNO` (500). A `message` nunca vaza detalhe de query, stack ou
existência de recurso alheio.
