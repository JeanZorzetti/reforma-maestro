# Data Model: Web App de Controle Financeiro de Obras

**Feature**: `001-web-app-obras` | **Date**: 2026-08-11 | **Fase**: 1

Schema Postgres, definido em `frontend-next/src/db/schema.ts` (Drizzle) e
materializado em migrações versionadas em `frontend-next/src/db/migrations/`.

Convenções: PKs `uuid` com `gen_random_uuid()`; timestamps `timestamptz`;
**dinheiro sempre em centavos (`integer`)** conforme R10; nomes de coluna em
`snake_case`.

---

## Diagrama de relacionamentos

```text
users 1──n obras 1──n lancamentos
  │
  ├──1 subscriptions
  ├──n sessions          (Auth.js)
  ├──n accounts          (Auth.js, reservado)
  └──n audit_log

verification_tokens      (Auth.js, sem FK — reset de senha)
trial_grants             (sem FK — sobrevive à exclusão do usuário)
stripe_events            (sem FK — log de idempotência de webhook)
```

---

## `users`

Pessoa física titular da conta (entidade **Usuário** do spec). Tabela do adapter
Auth.js, estendida com `password_hash`.

| Coluna           | Tipo          | Restrições                              |
|------------------|---------------|-----------------------------------------|
| `id`             | `uuid`        | PK, default `gen_random_uuid()`         |
| `email`          | `text`        | NOT NULL, **UNIQUE**, sempre lowercase  |
| `email_verified` | `timestamptz` | NULL até confirmação                    |
| `password_hash`  | `text`        | NOT NULL, bcrypt custo 12               |
| `name`           | `text`        | NULL                                    |
| `created_at`     | `timestamptz` | NOT NULL, default `now()`               |

**Regras**
- E-mail é normalizado (`trim` + `lowercase`) antes de qualquer escrita ou busca;
  a UNIQUE é o que garante FR-001 contra duplicata.
- `password_hash` nunca sai da camada de dados — não aparece em retorno de
  Server Action, sessão ou log.
- Exclusão da conta (FR-028) é `DELETE` real, cascateando obras, lançamentos,
  sessões e assinatura. `trial_grants` e `audit_log` **não** cascateiam (R3,
  FR-030).

---

## `sessions`, `accounts`, `verification_tokens`

Tabelas padrão do adapter Drizzle do Auth.js. Não são estendidas.

- `sessions` (`session_token` PK, `user_id` FK CASCADE, `expires`) sustenta
  FR-003: logout apaga a linha, expiração é `expires < now()`.
- `verification_tokens` (`identifier`, `token` PK, `expires`) sustenta o reset de
  senha por e-mail (FR-002). Token de uso único: apagado ao ser consumido.
- `accounts` fica criada pelo adapter, sem provider OAuth configurado nesta fase.

---

## `obras`

Projeto de reforma/construção (entidade **Obra**). Uma conta pode ter várias
(FR-007).

| Coluna                | Tipo            | Restrições                                        |
|-----------------------|-----------------|---------------------------------------------------|
| `id`                  | `uuid`          | PK                                                |
| `user_id`             | `uuid`          | NOT NULL, FK → `users.id` ON DELETE CASCADE       |
| `nome`                | `text`          | NOT NULL, 1–120 chars                             |
| `orcamento_teto_cents`| `integer`       | NOT NULL, **CHECK > 0**                           |
| `reserva_pct`         | `numeric(5,2)`  | NOT NULL, **CHECK entre 0 e 100**                 |
| `arquivada_em`        | `timestamptz`   | NULL = ativa                                      |
| `created_at`          | `timestamptz`   | NOT NULL, default `now()`                         |
| `updated_at`          | `timestamptz`   | NOT NULL, default `now()`                         |

**Índices**: `(user_id, arquivada_em)` — lista de obras da conta.

**Regras de validação** (FR-005, espelhadas em Zod e em CHECK no banco)
- `orcamento_teto_cents > 0` → mensagem "O orçamento teto precisa ser maior que
  zero."
- `0 <= reserva_pct <= 100` → mensagem "O fundo de reserva precisa estar entre 0%
  e 100%."

**Ciclo de vida (FR-007a)**
```text
ativa ──arquivar──> arquivada ──desarquivar──> ativa
  │                     │
  └────────── excluir ──┴──> removida (CASCADE nos lançamentos)
```
Arquivar é reversível e preserva os lançamentos; excluir apaga a obra e seus
lançamentos e exige confirmação explícita informando a quantidade de lançamentos
que serão perdidos (edge case "excluir obra que ainda tem lançamentos").

**Campos derivados** (calculados, nunca persistidos — R12)
| Derivado                | Fórmula                                                          |
|-------------------------|------------------------------------------------------------------|
| `reserva_cents`         | `round(orcamento_teto_cents * reserva_pct / 100)`                |
| `total_previsto_cents`  | `SUM(lancamentos.previsto_cents)`                                |
| `total_pago_cents`      | `SUM(lancamentos.pago_cents)`                                    |
| `saldo_cents`           | `orcamento_teto_cents - total_previsto_cents`                    |
| `saldo_disponivel_cents`| `saldo_cents - reserva_cents` (FR-017)                           |
| `pct_consumido`         | `total_previsto_cents / orcamento_teto_cents * 100`              |
| `excedido_cents`        | `max(0, total_previsto_cents - orcamento_teto_cents)` (FR-016)   |

`excedido_cents > 0` é o gatilho da sinalização de estouro. Obra sem lançamentos
tem todos os totais em `0` e `pct_consumido = 0`.

---

## `lancamentos`

Um gasto dentro de uma obra (entidade **Lançamento**).

| Coluna           | Tipo         | Restrições                                       |
|------------------|--------------|--------------------------------------------------|
| `id`             | `uuid`       | PK                                               |
| `obra_id`        | `uuid`       | NOT NULL, FK → `obras.id` ON DELETE CASCADE      |
| `data`           | `date`       | NOT NULL                                         |
| `categoria`      | `categoria`  | NOT NULL, enum Postgres (abaixo)                 |
| `item`           | `text`       | NOT NULL, 1–200 chars                            |
| `fornecedor`     | `text`       | NULL, até 200 chars                              |
| `previsto_cents` | `integer`    | NOT NULL, **CHECK >= 0**                         |
| `pago_cents`     | `integer`    | NOT NULL, default `0`, **CHECK >= 0**            |
| `created_at`     | `timestamptz`| NOT NULL, default `now()`                        |
| `updated_at`     | `timestamptz`| NOT NULL, default `now()`                        |

**Índices**: `(obra_id, data DESC)` para listagem ordenada e paginada;
`(obra_id, categoria)` para a quebra por categoria (SC-009).

**Sem `user_id`**: o dono vem por `obra_id → obras.user_id`. Toda query de
lançamento faz join ou subquery escopada ao usuário autenticado (FR-029) — a
ausência da coluna torna impossível esquecer o join e ler dado alheio por
acidente.

**Campos derivados** (FR-010 — nunca informados nem persistidos)
| Derivado    | Fórmula                                                   |
|-------------|-----------------------------------------------------------|
| `status`    | `pago_cents >= previsto_cents ? 'Pago' : 'Pendente'`      |
| `diferenca_cents` | `pago_cents - previsto_cents` (positivo = estourou o item) |

**Regras**
- `pago_cents > previsto_cents` é **permitido** (estouro no item, edge case) e
  destacado na UI; não é erro de validação.
- `data` futura é **permitida** (gasto programado), com aviso visual discreto.
- Filtro por status opera sobre a expressão derivada no `WHERE`, não sobre coluna
  (FR-012).

---

## `categoria` (enum Postgres)

Entidade **Categoria** — classificação fechada (FR-009).

```sql
CREATE TYPE categoria AS ENUM ('material', 'mao_de_obra', 'taxas', 'mobilia');
```

Rótulos de exibição: Material, Mão de Obra, Taxas, Mobília. O enum no banco é a
garantia de FR-009 mesmo contra escrita fora da aplicação. Categorias
personalizadas estão fora de escopo (Assumptions).

---

## `subscriptions`

Vínculo entre usuário e direito de acesso pago (entidade **Assinatura**).
**Uma linha por usuário**, criada junto com a conta.

| Coluna                    | Tipo                  | Restrições                                    |
|---------------------------|-----------------------|-----------------------------------------------|
| `user_id`                 | `uuid`                | **PK**, FK → `users.id` ON DELETE CASCADE     |
| `status`                  | `subscription_status` | NOT NULL, enum (abaixo)                       |
| `access_until`            | `timestamptz`         | NOT NULL                                      |
| `stripe_customer_id`      | `text`                | NULL até o primeiro checkout, UNIQUE          |
| `stripe_subscription_id`  | `text`                | NULL até assinar, UNIQUE                      |
| `cancel_at_period_end`    | `boolean`             | NOT NULL, default `false`                     |
| `last_event_at`           | `timestamptz`         | NULL — guarda `event.created` do último evento aplicado |
| `trial_warned_at`         | `timestamptz`         | NULL — último aviso de expiração enviado (D-3 ou D-1)   |
| `suspensao_avisada_em`    | `timestamptz`         | NULL — aviso de suspensão iminente enviado    |
| `updated_at`              | `timestamptz`         | NOT NULL, default `now()`                     |

```sql
CREATE TYPE subscription_status AS ENUM
  ('trialing', 'active', 'canceled', 'past_due', 'expired');
```

**Estado inicial**: `status = 'trialing'`, `access_until = now() + interval '14
days'` — salvo se `trial_grants` já tiver o hash do e-mail, caso em que nasce
`status = 'expired'`, `access_until = now()` (R3, FR-025c).

**Máquina de estados** (transições dirigidas por webhook, R4/R5)
```text
                    checkout.session.completed
        trialing ─────────────────────────────────> active
           │                                        │  ▲
   now() > access_until                             │  │ invoice.payment_succeeded
           ▼                                        │  │
        expired <───── customer.subscription.deleted┤  │
           ▲                                        │  │
           │                     invoice.payment_failed  │
           │                                        ▼  │
           │                                     past_due
           │                                        │
           │            cancel_at_period_end=true   ▼
           └──── now() > access_until ────────── canceled
```

**Invariantes**
- `access_until` só é reduzido por evento cujo `event.created >= last_event_at`
  (FR-020). Evento mais antigo é descartado.
- `access_until` **nunca retrocede** na transição `trialing → active`: quem assina
  antes do fim do trial leva os dias restantes junto, via `trial_end` no Checkout
  (R2, edge case "assina antes de o teste acabar").
- Nenhum estado apaga obras ou lançamentos (FR-022).
- A decisão de acesso lê **esta tabela**, sempre no servidor (FR-019).

**Marcadores de notificação**: `trial_warned_at` e `suspensao_avisada_em` existem
só para impedir reenvio — o cron é diário e idempotente por comparação desses
timestamps, não por estado externo (FR-023, FR-025a).

**Derivado — `tier`** (R4, função pura testável):
```text
tier = (status != 'expired' && now() <= access_until) ? 'full' : 'readonly'
```
`full` = tudo. `readonly` = ler obras/lançamentos + exportar; bloqueia criar,
editar e excluir obra e lançamento.

---

## `trial_grants`

Registro de que um e-mail já consumiu o teste gratuito. **Não referencia
`users`** e sobrevive à exclusão da conta (R3, FR-025c, SC-012).

| Coluna          | Tipo          | Restrições                                |
|-----------------|---------------|-------------------------------------------|
| `email_hash`    | `text`        | **PK** — SHA-256 do e-mail normalizado    |
| `granted_at`    | `timestamptz` | NOT NULL, default `now()`                 |

Gravado na mesma transação da criação da conta. Guardar o hash e não o e-mail
mantém o registro fora do alcance de identificação direta, compatível com o
direito de exclusão da LGPD (FR-028).

---

## `stripe_events`

Log de idempotência do webhook (R5, FR-020).

| Coluna         | Tipo          | Restrições                                     |
|----------------|---------------|------------------------------------------------|
| `id`           | `text`        | **PK** — `event.id` do Stripe                  |
| `type`         | `text`        | NOT NULL                                       |
| `event_created`| `timestamptz` | NOT NULL — `event.created`                     |
| `applied`      | `boolean`     | NOT NULL — `false` quando descartado por ordem |
| `unmatched`    | `boolean`     | NOT NULL, default `false` (R6)                 |
| `received_at`  | `timestamptz` | NOT NULL, default `now()`                      |

`INSERT ... ON CONFLICT (id) DO NOTHING` é o mecanismo de idempotência: zero
linhas afetadas ⇒ evento repetido ⇒ handler responde `200` sem reprocessar.

---

## `audit_log`

Trilha de auditoria de acesso e de mudança de estado de assinatura (FR-030).

| Coluna       | Tipo          | Restrições                                           |
|--------------|---------------|------------------------------------------------------|
| `id`         | `bigserial`   | PK                                                   |
| `user_id`    | `uuid`        | NULL, FK → `users.id` **ON DELETE SET NULL**         |
| `event`      | `text`        | NOT NULL — `login`, `login_failed`, `logout`, `password_reset`, `subscription_changed`, `access_denied`, `webhook_unmatched`, `account_deleted` |
| `detail`     | `jsonb`       | NOT NULL, default `'{}'` — sem dado sensível         |
| `created_at` | `timestamptz` | NOT NULL, default `now()`                            |

**Índice**: `(user_id, created_at DESC)`.

`SET NULL` (e não CASCADE) preserva a trilha de cobrança após exclusão da conta,
sem manter o vínculo com a pessoa. `detail` nunca guarda senha, hash, token de
sessão ou chave do Stripe.

---

## Retenção de dados (FR-028)

FR-028 exige **declarar** o prazo de retenção e **permitir a exclusão a pedido**.
É exatamente o que esta versão implementa — nada mais:

- **Exclusão a pedido**: imediata e irreversível. `DELETE FROM users` cascateando
  obras, lançamentos, sessões e assinatura; `trial_grants` e `audit_log`
  permanecem (sem vínculo identificável).
- **Retenção declarada**: dados de contas inativas são mantidos **por tempo
  indeterminado até que o titular solicite a exclusão**. A política pública diz
  isso com essas palavras.

**Expurgo automático de contas inativas está fora de escopo nesta versão.** Não
existe job, não existe aviso prévio e a política não promete nenhum dos dois —
prometer um expurgo que ninguém constrói seria passivo de compliance, não
feature. Se a retenção passar a ter custo ou exigência real, o gancho natural é o
cron diário que já existe para os avisos de trial.

---

## Rastreabilidade requisito → modelo

| Requisito | Onde vive |
|-----------|-----------|
| FR-001/002/003 | `users`, `sessions`, `verification_tokens` |
| FR-004/005/006 | `obras` + CHECKs de `orcamento_teto_cents` e `reserva_pct` |
| FR-007/007a | `obras.user_id`, `obras.arquivada_em` |
| FR-008/009 | `lancamentos`, enum `categoria` |
| FR-010 | derivados `status` e `diferenca_cents` |
| FR-011/012 | índices `(obra_id, data DESC)` e `(obra_id, categoria)` |
| FR-013 | centavos + formatação pt-BR na borda |
| FR-014/015/016/017 | derivados de `obras` |
| FR-018/021/022 | `subscriptions.status` + `access_until` |
| FR-019 | `tier` derivado no servidor |
| FR-020 | `stripe_events`, `subscriptions.last_event_at` |
| FR-025c | `trial_grants` |
| FR-026/027 | leitura de `lancamentos` sem exigir tier `full` |
| FR-028 | política de retenção + `DELETE` cascateado |
| FR-029 | ausência de `user_id` em `lancamentos` (join obrigatório) |
| FR-030 | `audit_log` |
